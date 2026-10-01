//! How much of the processor the background work takes when the setting is automatic
//! (`AppSettings::cpu_concurrency = 0`): half, so the computer stays quiet and usable
//! while a library is analysed (the user's choice, 2026-10-01; the whole processor kept
//! the fan at full speed for ~20 min on 4 273 photos). A manual value is used as is.

/// Half, at least one.
fn half(n: usize) -> usize {
    (n / 2).max(1)
}

fn logical() -> usize {
    std::thread::available_parallelism().map_or(1, |n| n.get())
}

/// Files read and photos analysed at the same time (automatic: half the logical cores).
pub fn workers(cpu_concurrency: u32) -> usize {
    match cpu_concurrency {
        0 => half(logical()),
        n => n as usize,
    }
}

/// Threads of one AI inference (automatic: half the physical cores; the runtime's own
/// default is one per physical core).
pub fn ai_threads(cpu_concurrency: u32) -> usize {
    match cpu_concurrency {
        0 => half(sysinfo::System::physical_core_count().unwrap_or_else(|| half(logical()))),
        n => n as usize,
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn automatic_takes_half_and_manual_is_kept() {
        assert_eq!(half(16), 8);
        assert_eq!(half(1), 1);
        assert_eq!(workers(3), 3);
        assert_eq!(ai_threads(6), 6);
        assert!(workers(0) >= 1 && workers(0) <= logical().max(1));
        assert!(ai_threads(0) >= 1 && ai_threads(0) <= workers(0).max(1));
    }
}
