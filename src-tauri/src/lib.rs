mod sidecar;

use std::process::Command;
use std::fs;
use tauri::Manager;

#[tauri::command]
fn open_in_editor(path: String, editor: String) -> Result<(), String> {
    let editor_label = match editor.as_str() {
        "vscode" => "Visual Studio Code",
        "cursor" => "Cursor",
        _ => return Err(format!("Editor desconhecido: {editor}")),
    };

    #[cfg(target_os = "macos")]
    let spawn_result = Command::new("open").args(["-a", editor_label, &path]).spawn();

    #[cfg(not(target_os = "macos"))]
    let spawn_result = {
        let bin = if editor == "vscode" { "code" } else { "cursor" };
        Command::new(bin).arg(&path).spawn()
    };

    spawn_result
        .map_err(|e| format!("Não foi possível abrir o {editor_label}. Verifique se está instalado. ({e})"))?;
    Ok(())
}

#[tauri::command]
fn save_clipboard_image(file_name: String, image_data: Vec<u8>) -> Result<String, String> {
    let mut temp_dir = std::env::temp_dir();
    temp_dir.push("claude_clipboard");
    fs::create_dir_all(&temp_dir).map_err(|e| format!("Erro ao criar diretório: {e}"))?;

    let file_path = temp_dir.join(&file_name);
    fs::write(&file_path, image_data).map_err(|e| format!("Erro ao salvar imagem: {e}"))?;

    file_path
        .to_str()
        .map(|s| s.to_string())
        .ok_or_else(|| "Erro ao converter caminho".to_string())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(
            tauri_plugin_single_instance::init(|app, _args, _cwd| {
                if let Some(window) = app.get_webview_window("main") {
                    let _ = window.show();
                    let _ = window.set_focus();
                }
            })
        )
        .invoke_handler(tauri::generate_handler![open_in_editor, save_clipboard_image])
        .setup(|app| {
            let app_handle = app.handle().clone();
            tauri::async_runtime::spawn(async move {
                sidecar::start_services(&app_handle).await;
            });
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
