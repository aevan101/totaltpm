use std::io::Write;
use std::process::{Child, Command, Stdio};
use std::sync::Mutex;
use tauri::Manager;

struct ServerProcess(Mutex<Option<Child>>);

/// Lifecycle log — writes to both stdout and a file so we can debug
/// issues when the app is launched from Finder (where stdout is invisible).
static LOG_DIR: Mutex<Option<String>> = Mutex::new(None);

fn lifecycle_log(msg: &str) {
    let secs = std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .unwrap_or_default()
        .as_secs();
    let line = format!("[{}] {}\n", secs, msg);
    print!("{}", line);
    if let Some(dir) = LOG_DIR.lock().ok().and_then(|g| g.clone()) {
        let path = std::path::Path::new(&dir).join(".lifecycle.log");
        if let Ok(mut f) = std::fs::OpenOptions::new()
            .create(true)
            .append(true)
            .open(&path)
        {
            let _ = f.write_all(line.as_bytes());
        }
    }
}

/// Kill any orphaned Next.js server processes from previous app launches.
/// This prevents stale servers from occupying ports and serving old code.
fn kill_orphan_servers() {
    let _ = Command::new("pkill")
        .args(["-f", "next start"])
        .stdout(Stdio::null())
        .stderr(Stdio::null())
        .output();
    let _ = Command::new("pkill")
        .args(["-f", "next-server"])
        .stdout(Stdio::null())
        .stderr(Stdio::null())
        .output();
    std::thread::sleep(std::time::Duration::from_millis(500));
}

/// Build a PATH that includes Node.js, git, and other tools.
/// Scans the filesystem directly — no shell dependency, so it works
/// identically whether launched from Terminal, Finder, or the Dock.
fn get_enhanced_path() -> String {
    let home = std::env::var("HOME").unwrap_or_else(|_| String::from("/Users/unknown"));
    let base_path = std::env::var("PATH").unwrap_or_default();

    let mut paths: Vec<String> = Vec::new();

    // NVM node versions (latest first)
    let nvm_dir = format!("{}/.nvm/versions/node", home);
    if let Ok(entries) = std::fs::read_dir(&nvm_dir) {
        let mut versions: Vec<String> = entries
            .filter_map(|e| e.ok())
            .filter(|e| e.file_type().map(|t| t.is_dir()).unwrap_or(false))
            .map(|e| e.path().join("bin").to_string_lossy().to_string())
            .collect();
        versions.sort();
        versions.reverse();
        paths.extend(versions);
    }

    // Common tool locations
    let extra = [
        format!("{}/.volta/bin", home),
        "/opt/uber/bin".to_string(),
        "/opt/homebrew/bin".to_string(),
        "/usr/local/bin".to_string(),
    ];
    for p in &extra {
        if std::path::Path::new(p).is_dir() {
            paths.push(p.clone());
        }
    }

    if !base_path.is_empty() {
        paths.push(base_path);
    }

    let result = paths.join(":");
    lifecycle_log(&format!("Resolved PATH: {}", result));
    result
}

/// Find an available port starting from the preferred one.
fn find_available_port(start: u16) -> u16 {
    for port in start..start + 100 {
        if std::net::TcpListener::bind(("127.0.0.1", port)).is_ok() {
            return port;
        }
    }
    start
}

/// Run git pull in the project directory. Returns true if code was updated.
fn run_git_pull(project_dir: &str) -> bool {
    lifecycle_log("Running git pull --ff-only...");
    let enhanced_path = get_enhanced_path();

    // Reset package-lock.json before pulling — corporate npm registries rewrite
    // this file during `npm install`, creating dirty state that blocks ff-only pull.
    let _ = Command::new("git")
        .args(["checkout", "--", "package-lock.json"])
        .current_dir(project_dir)
        .env("PATH", &enhanced_path)
        .stdout(Stdio::piped())
        .stderr(Stdio::piped())
        .output();

    match Command::new("git")
        .args(["pull", "--ff-only", "origin", "main"])
        .current_dir(project_dir)
        .env("PATH", &enhanced_path)
        .stdout(Stdio::piped())
        .stderr(Stdio::piped())
        .output()
    {
        Ok(output) => {
            let stdout = String::from_utf8_lossy(&output.stdout);
            let stderr = String::from_utf8_lossy(&output.stderr);
            if output.status.success() {
                let msg = stdout.trim();
                lifecycle_log(&format!("git pull: {}", msg));
                !msg.contains("Already up to date")
            } else {
                lifecycle_log(&format!("git pull warning: {}", stderr.trim()));
                lifecycle_log(&format!("git pull stdout: {}", stdout.trim()));
                false
            }
        }
        Err(e) => {
            lifecycle_log(&format!("git pull failed to execute: {}", e));
            false
        }
    }
}

/// Run npm install if node_modules is missing or package-lock.json is newer.
fn run_npm_install(project_dir: &str) -> bool {
    let node_modules = std::path::Path::new(project_dir).join("node_modules");
    let lock_file = std::path::Path::new(project_dir).join("package-lock.json");

    let needs_install = if !node_modules.exists() {
        lifecycle_log("node_modules missing, running npm install...");
        true
    } else if lock_file.exists() {
        let lock_modified = lock_file
            .metadata()
            .and_then(|m| m.modified())
            .unwrap_or(std::time::SystemTime::UNIX_EPOCH);
        let nm_modified = node_modules
            .metadata()
            .and_then(|m| m.modified())
            .unwrap_or(std::time::SystemTime::UNIX_EPOCH);

        if lock_modified > nm_modified {
            lifecycle_log("package-lock.json changed, running npm install...");
            true
        } else {
            lifecycle_log("node_modules up to date, skipping npm install");
            false
        }
    } else {
        false
    };

    if !needs_install {
        return false;
    }

    let enhanced_path = get_enhanced_path();
    match Command::new("npm")
        .args(["install"])
        .current_dir(project_dir)
        .env("PATH", &enhanced_path)
        .stdout(Stdio::piped())
        .stderr(Stdio::piped())
        .output()
    {
        Ok(output) => {
            if output.status.success() {
                lifecycle_log("npm install completed");
                true
            } else {
                let stderr = String::from_utf8_lossy(&output.stderr);
                lifecycle_log(&format!("npm install failed: {}", stderr.trim()));
                false
            }
        }
        Err(e) => {
            lifecycle_log(&format!("npm install failed to execute: {}", e));
            false
        }
    }
}

/// Get the current git HEAD commit hash.
fn get_git_head(project_dir: &str) -> Option<String> {
    let enhanced_path = get_enhanced_path();
    Command::new("git")
        .args(["rev-parse", "HEAD"])
        .current_dir(project_dir)
        .env("PATH", &enhanced_path)
        .stdout(Stdio::piped())
        .stderr(Stdio::piped())
        .output()
        .ok()
        .filter(|o| o.status.success())
        .map(|o| String::from_utf8_lossy(&o.stdout).trim().to_string())
}

/// Save the current HEAD hash as the build marker.
fn save_build_marker(project_dir: &str) {
    if let Some(head) = get_git_head(project_dir) {
        let marker = std::path::Path::new(project_dir).join(".next/.build-commit");
        let _ = std::fs::write(&marker, &head);
        lifecycle_log(&format!("Saved build marker: {}", head.trim()));
    }
}

/// Build the Next.js app for production.
fn run_next_build(project_dir: &str) -> bool {
    let enhanced_path = get_enhanced_path();

    // Delete .next directory to ensure a clean build
    let next_dir = std::path::Path::new(project_dir).join(".next");
    if next_dir.exists() {
        lifecycle_log("Removing .next directory for clean build...");
        if let Err(e) = std::fs::remove_dir_all(&next_dir) {
            lifecycle_log(&format!("Failed to remove .next: {}", e));
        }
    }

    lifecycle_log("Building Next.js for production...");

    match Command::new("npx")
        .args(["next", "build"])
        .current_dir(project_dir)
        .env("PATH", &enhanced_path)
        .stdout(Stdio::piped())
        .stderr(Stdio::piped())
        .output()
    {
        Ok(output) => {
            let stdout = String::from_utf8_lossy(&output.stdout);
            let stderr = String::from_utf8_lossy(&output.stderr);
            if output.status.success() {
                lifecycle_log("Build complete");
                lifecycle_log(&format!("Build stdout: {}", stdout.trim()));
                save_build_marker(project_dir);
                true
            } else {
                lifecycle_log(&format!("Next.js build failed stderr: {}", stderr.trim()));
                lifecycle_log(&format!("Next.js build failed stdout: {}", stdout.trim()));
                false
            }
        }
        Err(e) => {
            lifecycle_log(&format!("Next.js build failed to execute: {}", e));
            false
        }
    }
}

/// Start the Next.js server on the given port.
fn start_nextjs_server(project_dir: &str, port: u16) -> Result<Child, String> {
    let enhanced_path = get_enhanced_path();

    let child = if cfg!(debug_assertions) {
        Command::new("npx")
            .args(["next", "dev", "--port", &port.to_string()])
            .current_dir(project_dir)
            .env("PATH", &enhanced_path)
            .stdout(Stdio::piped())
            .stderr(Stdio::piped())
            .spawn()
            .map_err(|e| format!("Failed to start Next.js dev server: {}", e))?
    } else {
        Command::new("npx")
            .args(["next", "start", "--port", &port.to_string()])
            .current_dir(project_dir)
            .env("PATH", &enhanced_path)
            .stdout(Stdio::piped())
            .stderr(Stdio::piped())
            .spawn()
            .map_err(|e| format!("Failed to start Next.js production server: {}", e))?
    };

    lifecycle_log(&format!(
        "Next.js server started on port {} (PID: {})",
        port,
        child.id()
    ));
    Ok(child)
}

/// Wait for the server to respond to HTTP requests.
async fn wait_for_server(port: u16, max_retries: u32) -> Result<(), String> {
    let url = format!("http://localhost:{}", port);
    let client = reqwest::Client::builder()
        .timeout(std::time::Duration::from_secs(2))
        .build()
        .map_err(|e| format!("Failed to create HTTP client: {}", e))?;

    for attempt in 1..=max_retries {
        match client.get(&url).send().await {
            Ok(response)
                if response.status().is_success() || response.status().is_redirection() =>
            {
                lifecycle_log(&format!("Server ready after {} attempts", attempt));
                return Ok(());
            }
            Ok(_) => {}
            Err(_) => {
                if attempt % 10 == 0 {
                    lifecycle_log(&format!(
                        "Waiting for server... (attempt {}/{})",
                        attempt, max_retries
                    ));
                }
            }
        }
        tokio::time::sleep(std::time::Duration::from_millis(500)).await;
    }

    Err(format!(
        "Server did not become ready after {} attempts",
        max_retries
    ))
}

/// Kill the server process and all its children.
fn kill_server(child: &mut Child) {
    let pid = child.id();
    lifecycle_log(&format!("Killing Next.js server (PID: {})...", pid));

    #[cfg(unix)]
    {
        unsafe {
            libc::kill(-(pid as i32), libc::SIGTERM);
        }
        std::thread::sleep(std::time::Duration::from_secs(1));
        let _ = child.kill();
    }

    #[cfg(not(unix))]
    {
        let _ = child.kill();
    }

    let _ = child.wait();
    lifecycle_log("Server process terminated");
}

/// Send a status update to the loading screen.
fn send_status(app_handle: &tauri::AppHandle, msg: &str) {
    lifecycle_log(&format!("Status: {}", msg));
    if let Some(window) = app_handle.get_webview_window("main") {
        let js = format!("if(typeof updateStatus==='function')updateStatus('{}')", msg.replace('\'', "\\'"));
        let _ = window.eval(&js);
    }
}

#[tauri::command]
fn open_url(url: String) -> Result<(), String> {
    Command::new("open")
        .arg(&url)
        .spawn()
        .map_err(|e| format!("Failed to open URL: {}", e))?;
    Ok(())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    // Determine the project directory
    let project_dir = if cfg!(debug_assertions) {
        let manifest_dir = env!("CARGO_MANIFEST_DIR");
        std::path::Path::new(manifest_dir)
            .parent()
            .unwrap()
            .to_string_lossy()
            .to_string()
    } else {
        if let Ok(dir) = std::env::var("TOTAL_TPM_PROJECT_DIR") {
            dir
        } else {
            let home = std::env::var("HOME").unwrap_or_else(|_| String::from("/Users/unknown"));
            let candidates = [
                format!("{}/Library/Mobile Documents/com~apple~CloudDocs/Documents/VS Code/Total TPM", home),
                format!("{}/totaltpm", home),
                format!("{}/Total TPM", home),
                format!("{}/Projects/Total TPM", home),
                format!("{}/Projects/totaltpm", home),
                format!("{}/Desktop/Total TPM", home),
                format!("{}/Desktop/totaltpm", home),
                format!("{}/Documents/Total TPM", home),
                format!("{}/Documents/totaltpm", home),
            ];

            candidates
                .iter()
                .find(|path| {
                    let p = std::path::Path::new(path);
                    p.join("package.json").exists() && p.join("src-tauri").exists()
                })
                .cloned()
                .unwrap_or_else(|| {
                    eprintln!("Could not find project directory. Set TOTAL_TPM_PROJECT_DIR env var.");
                    candidates[0].clone()
                })
        }
    };

    // Initialize lifecycle log — truncate old log on each launch
    if let Ok(mut g) = LOG_DIR.lock() {
        *g = Some(project_dir.clone());
    }
    let log_path = std::path::Path::new(&project_dir).join(".lifecycle.log");
    let _ = std::fs::write(&log_path, ""); // truncate
    lifecycle_log(&format!("=== App starting, project dir: {}", project_dir));

    // In production, kill orphaned servers and clear caches before anything else
    if !cfg!(debug_assertions) {
        lifecycle_log("Killing any orphaned Next.js server processes...");
        kill_orphan_servers();

        // Clear WebKit cache to prevent stale JS from previous builds
        let home = std::env::var("HOME").unwrap_or_else(|_| String::from("/Users/unknown"));
        let cache_dirs = [
            format!("{}/Library/WebKit/total-tpm", home),
            format!("{}/Library/WebKit/com.totaltpm.app", home),
            format!("{}/Library/Caches/total-tpm", home),
            format!("{}/Library/Caches/com.totaltpm.app", home),
        ];
        for dir in &cache_dirs {
            let p = std::path::Path::new(dir);
            if p.exists() {
                lifecycle_log(&format!("Clearing webview cache: {}", dir));
                let _ = std::fs::remove_dir_all(p);
            }
        }
    }

    let project_dir_for_setup = project_dir.clone();

    let app = tauri::Builder::default()
        .manage(ServerProcess(Mutex::new(None)))
        .invoke_handler(tauri::generate_handler![open_url])
        .setup(move |app| {
            let app_handle = app.handle().clone();
            let dir = project_dir_for_setup.clone();

            tauri::async_runtime::spawn(async move {
                if cfg!(debug_assertions) {
                    lifecycle_log("Dev mode — server managed by Tauri CLI");
                    tokio::time::sleep(std::time::Duration::from_millis(1000)).await;
                    if let Some(window) = app_handle.get_webview_window("main") {
                        let _ = window.show();
                        let _ = window.set_focus();
                    }
                } else {
                    // Production mode: full lifecycle management

                    // Log HEAD commit for diagnostics
                    if let Some(head) = get_git_head(&dir) {
                        lifecycle_log(&format!("HEAD before pull: {}", head));
                    }

                    // Step 1: Git pull
                    send_status(&app_handle, "Checking for updates...");
                    let code_changed = run_git_pull(&dir);
                    if code_changed {
                        send_status(&app_handle, "Updates found, applying...");
                    } else {
                        send_status(&app_handle, "Up to date");
                    }

                    if let Some(head) = get_git_head(&dir) {
                        lifecycle_log(&format!("HEAD after pull: {}", head));
                    }

                    // Step 2: npm install if needed
                    send_status(&app_handle, "Checking dependencies...");
                    let deps_installed = run_npm_install(&dir);
                    if deps_installed {
                        send_status(&app_handle, "Dependencies updated");
                    }

                    // Step 3: ALWAYS rebuild — eliminates all stale-code issues.
                    send_status(&app_handle, "Building application...");
                    if !run_next_build(&dir) {
                        lifecycle_log("BUILD FAILED — this is the likely cause of stale code");
                        send_status(&app_handle, "Build failed — starting with previous version");
                    }

                    // Step 4: Find available port
                    send_status(&app_handle, "Starting server...");
                    let port = find_available_port(3000);
                    lifecycle_log(&format!("Using port: {}", port));

                    // Step 5: Start Next.js server
                    match start_nextjs_server(&dir, port) {
                        Ok(child) => {
                            let state = app_handle.state::<ServerProcess>();
                            *state.0.lock().unwrap() = Some(child);

                            // Step 6: Wait for server
                            send_status(&app_handle, "Almost ready...");
                            match wait_for_server(port, 60).await {
                                Ok(()) => {
                                    lifecycle_log(&format!("Navigating webview to http://localhost:{}", port));
                                    if let Some(window) = app_handle.get_webview_window("main") {
                                        let url = format!("http://localhost:{}", port);
                                        let _ = window.navigate(url.parse().unwrap());
                                        tokio::time::sleep(
                                            std::time::Duration::from_millis(500),
                                        )
                                        .await;
                                        let _ = window.set_focus();
                                    }
                                }
                                Err(e) => {
                                    lifecycle_log(&format!("Server failed to start: {}", e));
                                    send_status(&app_handle, "Server failed to start");
                                }
                            }
                        }
                        Err(e) => {
                            lifecycle_log(&format!("Failed to start server: {}", e));
                            send_status(&app_handle, "Failed to start server");
                        }
                    }

                    lifecycle_log("=== Lifecycle complete");
                }
            });

            Ok(())
        })
        .build(tauri::generate_context!())
        .expect("error while building tauri application");

    app.run(move |app_handle, event| match event {
        tauri::RunEvent::ExitRequested { .. } | tauri::RunEvent::Exit => {
            let mut child_opt = app_handle
                .state::<ServerProcess>()
                .0
                .lock()
                .unwrap()
                .take();
            if let Some(ref mut child) = child_opt {
                kill_server(child);
            }
        }
        _ => {}
    });
}
