use std::process::{Child, Command, Stdio};
use std::sync::Mutex;
use tauri::Manager;

struct ServerProcess(Mutex<Option<Child>>);

/// Build a PATH that includes common Node.js and git locations.
/// macOS apps launched from Finder have a minimal PATH.
fn get_enhanced_path() -> String {
    let home = std::env::var("HOME").unwrap_or_else(|_| String::from("/Users/angelevan"));
    let base_path = std::env::var("PATH").unwrap_or_default();
    format!(
        "/usr/local/bin:/opt/homebrew/bin:{}/.nvm/versions/node/v24.11.0/bin:{}",
        home, base_path
    )
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

/// Run git pull in the project directory. Failures are non-fatal.
fn run_git_pull(project_dir: &str) {
    println!("[Total TPM] Running git pull...");
    let enhanced_path = get_enhanced_path();

    match Command::new("git")
        .args(["pull", "origin", "main"])
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
                println!("[Total TPM] git pull: {}", stdout.trim());
            } else {
                eprintln!("[Total TPM] git pull warning: {}", stderr.trim());
            }
        }
        Err(e) => {
            eprintln!("[Total TPM] git pull failed to execute: {}", e);
        }
    }
}

/// Run npm install if node_modules is missing or package-lock.json is newer.
fn run_npm_install(project_dir: &str) {
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
        return;
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
            } else {
                let stderr = String::from_utf8_lossy(&output.stderr);
                eprintln!("[Total TPM] npm install failed: {}", stderr.trim());
            }
        }
        Err(e) => {
            eprintln!("[Total TPM] npm install failed to execute: {}", e);
        }
    }
}

/// Start the Next.js server on the given port.
fn start_nextjs_server(project_dir: &str, port: u16) -> Result<Child, String> {
    let enhanced_path = get_enhanced_path();

    let child = if cfg!(debug_assertions) {
        // Development: use next dev
        Command::new("npx")
            .args(["next", "dev", "--port", &port.to_string()])
            .current_dir(project_dir)
            .env("PATH", &enhanced_path)
            .stdout(Stdio::piped())
            .stderr(Stdio::piped())
            .spawn()
            .map_err(|e| format!("Failed to start Next.js dev server: {}", e))?
    } else {
        // Production: build first, then start
        println!("[Total TPM] Building Next.js for production...");
        let build_output = Command::new("npx")
            .args(["next", "build"])
            .current_dir(project_dir)
            .env("PATH", &enhanced_path)
            .stdout(Stdio::piped())
            .stderr(Stdio::piped())
            .output()
            .map_err(|e| format!("Failed to build Next.js: {}", e))?;

        if !build_output.status.success() {
            let stderr = String::from_utf8_lossy(&build_output.stderr);
            return Err(format!("Next.js build failed: {}", stderr));
        }
        println!("[Total TPM] Build complete, starting production server...");

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
        // Production: use the known project directory
        let home = std::env::var("HOME").unwrap_or_else(|_| String::from("/Users/angelevan"));
        let default_dir = format!(
            "{}/Library/Mobile Documents/com~apple~CloudDocs/Documents/VS Code/Total TPM",
            home
        );
        // Allow override via environment variable
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
                    // Just show the window (server is already running).
                    println!("[Total TPM] Dev mode — server managed by Tauri CLI");
                    // Small delay to let the page finish loading
                    tokio::time::sleep(std::time::Duration::from_millis(1000)).await;
                    if let Some(window) = app_handle.get_webview_window("main") {
                        let _ = window.show();
                        let _ = window.set_focus();
                    }
                } else {
                    // Production mode: full lifecycle management
                    // Step 1: Git pull
                    println!("[Total TPM] === Step 1: Git pull ===");
                    run_git_pull(&dir);

                    // Step 2: npm install if needed
                    println!("[Total TPM] === Step 2: npm install check ===");
                    run_npm_install(&dir);

                    // Step 3: Find available port
                    println!("[Total TPM] === Step 3: Finding available port ===");
                    let port = find_available_port(3000);
                    println!("[Total TPM] Using port: {}", port);

                    // Step 4: Start Next.js server
                    println!("[Total TPM] === Step 4: Starting Next.js server ===");
                    match start_nextjs_server(&dir, port) {
                        Ok(child) => {
                            let state = app_handle.state::<ServerProcess>();
                            *state.0.lock().unwrap() = Some(child);

                            // Step 5: Wait for server
                            println!("[Total TPM] === Step 5: Waiting for server ===");
                            match wait_for_server(port, 60).await {
                                Ok(()) => {
                                    println!("[Total TPM] === Step 6: Showing window ===");
                                    if let Some(window) = app_handle.get_webview_window("main") {
                                        let url = format!("http://localhost:{}", port);
                                        let _ = window.navigate(url.parse().unwrap());
                                        tokio::time::sleep(
                                            std::time::Duration::from_millis(500),
                                        )
                                        .await;
                                        let _ = window.show();
                                        let _ = window.set_focus();
                                    }
                                }
                                Err(e) => {
                                    eprintln!("[Total TPM] Server failed to start: {}", e);
                                    if let Some(window) = app_handle.get_webview_window("main") {
                                        let _ = window.show();
                                    }
                                }
                            }
                        }
                        Err(e) => {
                            eprintln!("[Total TPM] Failed to start server: {}", e);
                            if let Some(window) = app_handle.get_webview_window("main") {
                                let _ = window.show();
                            }
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
