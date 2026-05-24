mod contact_sheet;
mod project;
mod thumbnail;

use contact_sheet::{export_contact_sheet_png, ContactSheetItem, ContactSheetOptions};
use project::{
    filter_image_paths, open_project_zip, read_file_bytes, save_project_zip, OpenProjectResult,
    SaveAsset,
};
use tauri::{Emitter, RunEvent};

#[tauri::command]
fn save_project(path: String, manifest: String, assets: Vec<SaveAsset>) -> Result<(), String> {
    save_project_zip(&path, &manifest, &assets)
}

#[tauri::command]
fn open_project(path: String) -> Result<OpenProjectResult, String> {
    open_project_zip(&path)
}

#[tauri::command]
fn read_image_file(path: String) -> Result<Vec<u8>, String> {
    read_file_bytes(&path)
}

#[tauri::command]
fn filter_image_paths_cmd(paths: Vec<String>) -> Vec<String> {
    filter_image_paths(paths)
}

#[tauri::command]
fn generate_thumbnail(path: String, max_dimension: Option<u32>) -> Result<Vec<u8>, String> {
    let data = read_file_bytes(&path)?;
    let max = max_dimension.unwrap_or(thumbnail::DEFAULT_THUMB_MAX);
    thumbnail::generate_thumbnail_bytes(&data, max)
}

#[tauri::command]
fn get_image_dimensions_from_path(path: String) -> Result<[u32; 2], String> {
    let data = read_file_bytes(&path)?;
    let (w, h) = thumbnail::image_dimensions(&data)?;
    Ok([w, h])
}

#[tauri::command]
fn export_contact_sheet(
    path: String,
    items: Vec<ContactSheetItem>,
    columns: u32,
    cell_size: u32,
    gap: u32,
    padding: u32,
    label_height: u32,
) -> Result<(), String> {
    export_contact_sheet_png(
        &path,
        &items,
        &ContactSheetOptions {
            columns,
            cell_size,
            gap,
            padding,
            label_height,
        },
    )
}

fn emit_open_project(app: &tauri::AppHandle, path: &str) {
    let _ = app.emit("open-project-file", path);
}

fn handle_launch_files(app: &tauri::AppHandle) {
    for arg in std::env::args().skip(1) {
        if arg.ends_with(".pur") || arg.ends_with(".pur.autosave") {
            emit_open_project(app, &arg);
            return;
        }
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_global_shortcut::Builder::new().build())
        .invoke_handler(tauri::generate_handler![
            save_project,
            open_project,
            read_image_file,
            filter_image_paths_cmd,
            generate_thumbnail,
            get_image_dimensions_from_path,
            export_contact_sheet,
        ])
        .setup(|app| {
            handle_launch_files(app.handle());
            Ok(())
        })
        .build(tauri::generate_context!())
        .expect("error while running tauri application")
        .run(|app_handle, event| {
            #[cfg(any(target_os = "macos", target_os = "ios", target_os = "linux"))]
            if let RunEvent::Opened { urls } = event {
                for url in urls {
                    if let Ok(path) = url.to_file_path() {
                        let p = path.to_string_lossy().to_string();
                        if p.ends_with(".pur") || p.ends_with(".pur.autosave") {
                            emit_open_project(app_handle, &p);
                        }
                    }
                }
            }
        });
}
