use std::process::{Child, Command, Stdio};
use std::sync::Mutex;
use tauri::Manager;

struct ServerProcess(Mutex<Option<Child>>);

/// Build a PATH that includes common Node.js and git locations.
/// Searches dynamically instead of hardcoding a single NVM version.
fn get_enhanced_path() -> String {
    let home = std::env::var("HOME").unwrap_or_else(|_| String::from("/Users/angelevan"));
    let base_path = std::env::var("PATH").unwrap_or_default();

    let mut paths: Vec<String> = vec![
        "/usr/local/bin".to_string(),
        "/opt/homebrew/bin".to_string(),
        format!("{}/.volta/bin", home),
    ];

    // Find NVM node versions dynamically (use the latest available)
    let nvm_dir = format!("{}/.nvm/versions/node", home);
    if let Ok(entries) = std::fs::read_dir(&nvm_dir) {
        let mut versions: Vec<String> = entries
            .filter_map(|e| e.ok())
            .filter(|e| e.file_type().map(|t| t.is_dir()).unwrap_or(false))
            .map(|e| e.path().join("bin").to_string_lossy().to_string())
            .collect();
        // Sort so the latest version comes first
        versions.sort();
        versions.reverse();
        paths.extend(versions);
    }

    paths.push(base_path);
    paths.join(":")
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
    println!("[Total TPM] Running git pull --ff-only...");
    let enhanced_path = get_enhanced_path();

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
                println!("[Total TPM] git pull: {}", msg);
                // Return true if code actually changed
                !msg.contains("Already up to date")
            } else {
                eprintln!("[Total TPM] git pull warning: {}", stderr.trim());
                eprintln!("[Total TPM] git pull stdout: {}", stdout.trim());
                false
            }
        }
        Err(e) => {
            eprintln!("[Total TPM] git pull failed to execute: {}", e);
            false
        }
    }
}

/// Run npm install if node_modules is missing or package-lock.json is newer.
fn run_npm_install(project_dir: &str) -> bool {
    let node_modules = std::path::Path::new(project_dir).join("node_modules");
    let lock_file = std::path::Path::new(project_dir).join("package-lock.json");

    let needs_install = if !node_modules.exists() {
        println!("[Total TPM] node_modules missing, running npm install...");
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
            println!("[Total TPM] package-lock.json changed, running npm install...");
            true
        } else {
            println!("[Total TPM] node_modules up to date, skipping npm install");
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
                println!("[Total TPM] npm install completed");
                true
            } else {
                let stderr = String::from_utf8_lossy(&output.stderr);
                eprintln!("[Total TPM] npm install failed: {}", stderr.trim());
                false
            }
        }
        Err(e) => {
            eprintln!("[Total TPM] npm install failed to execute: {}", e);
            false
        }
    }
}

/// Build the Next.js app for production.
fn run_next_build(project_dir: &str) -> bool {
    let enhanced_path = get_enhanced_path();
    println!("[Total TPM] Building Next.js for production...");

    match Command::new("npx")
        .args(["next", "build"])
        .current_dir(project_dir)
        .env("PATH", &enhanced_path)
        .stdout(Stdio::piped())
        .stderr(Stdio::piped())
        .output()
    {
        Ok(output) => {
            if output.status.success() {
                println!("[Total TPM] Build complete");
                true
            } else {
                let stderr = String::from_utf8_lossy(&output.stderr);
                eprintln!("[Total TPM] Next.js build failed: {}", stderr.trim());
                false
            }
        }
        Err(e) => {
            eprintln!("[Total TPM] Next.js build failed to execute: {}", e);
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

    println!(
        "[Total TPM] Next.js server started on port {} (PID: {})",
        port,
        child.id()
    );
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
                println!("[Total TPM] Server ready after {} attempts", attempt);
                return Ok(());
            }
            Ok(_) => {}
            Err(_) => {
                if attempt % 10 == 0 {
                    println!(
                        "[Total TPM] Waiting for server... (attempt {}/{})",
                        attempt, max_retries
                    );
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
    println!("[Total TPM] Killing Next.js server (PID: {})...", pid);

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
    println!("[Total TPM] Server process terminated");
}

/// Send a status update to the loading screen.
fn send_status(app_handle: &tauri::AppHandle, msg: &str) {
    println!("[Total TPM] Status: {}", msg);
    if let Some(window) = app_handle.get_webview_window("main") {
        let js = format!("if(typeof updateStatus==='function')updateStatus('{}')", msg.replace('\'', "\\'"));
        let _ = window.eval(&js);
    }
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
        let home = std::env::var("HOME").unwrap_or_else(|_| String::from("/Users/angelevan"));
        let default_dir = format!(
            "{}/Library/Mobile Documents/com~apple~CloudDocs/Documents/VS Code/Total TPM",
            home
        );
        std::env::var("TOTAL_TPM_PROJECT_DIR").unwrap_or(default_dir)
    };

    let project_dir_for_setup = project_dir.clone();

    let app = tauri::Builder::default()
        .manage(ServerProcess(Mutex::new(None)))
        .setup(move |app| {
            let app_handle = app.handle().clone();
            let dir = project_dir_for_setup.clone();

            tauri::async_runtime::spawn(async move {
                if cfg!(debug_assertions) {
                    // Dev mode: Tauri CLI starts the server via beforeDevCommand.
                    println!("[Total TPM] Dev mode — server managed by Tauri CLI");
                    tokio::time::sleep(std::time::Duration::from_millis(1000)).await;
                    if let Some(window) = app_handle.get_webview_window("main") {
                        let _ = window.show();
                        let _ = window.set_focus();
                    }
                } else {
                    // Production mode: full lifecycle management
                    // The loading screen is already visible via frontendDist

                    // Step 1: Git pull
                    send_status(&app_handle, "Checking for updates...");
                    let code_changed = run_git_pull(&dir);
                    if code_changed {
                        send_status(&app_handle, "Updates found, applying...");
                    } else {
                        send_status(&app_handle, "Up to date");
                    }

                    // Step 2: npm install if needed
                    send_status(&app_handle, "Checking dependencies...");
                    let deps_installed = run_npm_install(&dir);
                    if deps_installed {
                        send_status(&app_handle, "Dependencies updated");
                    }

                    // Step 3: Build only if code or deps changed
                    let next_dir = std::path::Path::new(&dir).join(".next");
                    let needs_build = code_changed || deps_installed || !next_dir.exists();

                    if needs_build {
                        send_status(&app_handle, "Building application...");
                        if !run_next_build(&dir) {
                            send_status(&app_handle, "Build failed — starting with previous version");
                        }
                    } else {
                        println!("[Total TPM] No changes, skipping build");
                    }

                    // Step 4: Find available port
                    send_status(&app_handle, "Starting server...");
                    let port = find_available_port(3000);
                    println!("[Total TPM] Using port: {}", port);

                    // Step 5: Start Next.js server
                    match start_nextjs_server(&dir, port) {
                        Ok(child) => {
                            let state = app_handle.state::<ServerProcess>();
                            *state.0.lock().unwrap() = Some(child);

                            // Step 6: Wait for server
                            send_status(&app_handle, "Almost ready...");
                            match wait_for_server(port, 60).await {
                                Ok(()) => {
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
                                    eprintln!("[Total TPM] Server failed to start: {}", e);
                                    send_status(&app_handle, "Server failed to start");
                                }
                            }
                        }
                        Err(e) => {
                            eprintln!("[Total TPM] Failed to start server: {}", e);
                            send_status(&app_handle, "Failed to start server");
                        }
                    }
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
