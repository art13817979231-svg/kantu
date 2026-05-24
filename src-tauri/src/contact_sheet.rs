use image::imageops::FilterType;
use image::{ImageBuffer, Rgba, RgbaImage};
use std::path::Path;

#[derive(Debug, serde::Deserialize)]
pub struct ContactSheetItem {
    pub data: Vec<u8>,
    pub name: String,
}

#[derive(Debug, serde::Deserialize)]
pub struct ContactSheetOptions {
    pub columns: u32,
    pub cell_size: u32,
    pub gap: u32,
    pub padding: u32,
    pub label_height: u32,
}

pub fn export_contact_sheet_png(
    path: &str,
    items: &[ContactSheetItem],
    opts: &ContactSheetOptions,
) -> Result<(), String> {
    if items.is_empty() {
        return Err("没有可导出的图片".to_string());
    }

    let cols = opts.columns.max(1);
    let rows = (items.len() as u32 + cols - 1) / cols;
    let cell = opts.cell_size;
    let gap = opts.gap;
    let pad = opts.padding;
    let label_h = opts.label_height;

    let sheet_w = pad * 2 + cols * cell + (cols - 1) * gap;
    let sheet_h = pad * 2 + rows * (cell + label_h) + (rows - 1) * gap;

    let mut sheet: RgbaImage = ImageBuffer::from_pixel(sheet_w, sheet_h, Rgba([32, 32, 40, 255]));

    for (idx, item) in items.iter().enumerate() {
        let col = idx as u32 % cols;
        let row = idx as u32 / cols;
        let x0 = pad + col * (cell + gap);
        let y0 = pad + row * (cell + label_h + gap);

        let img = image::load_from_memory(&item.data).map_err(|e| e.to_string())?;
        let thumb = img.resize_to_fill(cell, cell, FilterType::Triangle);
        image::imageops::overlay(&mut sheet, &thumb, x0 as i64, y0 as i64);

        draw_label_stub(&mut sheet, x0, y0 + cell, cell, label_h, &item.name);
    }

    sheet
        .save_with_format(Path::new(path), image::ImageFormat::Png)
        .map_err(|e| e.to_string())?;
    Ok(())
}

fn draw_label_stub(
    sheet: &mut RgbaImage,
    x: u32,
    y: u32,
    w: u32,
    h: u32,
    _name: &str,
) {
    if h == 0 {
        return;
    }
    for py in y..y + h.min(24) {
        for px in x..x + w {
            if px < sheet.width() && py < sheet.height() {
                sheet.put_pixel(px, py, Rgba([50, 50, 58, 255]));
            }
        }
    }
}
