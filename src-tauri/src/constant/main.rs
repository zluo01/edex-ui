pub fn writer_event_key(id: &u8) -> String {
    return format!("writer-{}", id)
}

pub fn resize_event_key(id: &u8) -> String {
    return format!("resize-{}", id)
}

pub fn reader_event_key(id: &u8) -> String {
    return format!("data-{}", id)
}

pub const DESTROY_TERMINAL: &str = "destroy";
pub const SINGLE_INSTANCE: &str = "single-instance";
pub const UPDATE_FILES: &str = "files";
