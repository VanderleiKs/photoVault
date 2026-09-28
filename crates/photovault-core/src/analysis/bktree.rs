//! BK-tree over 64-bit perceptual hashes (Hamming distance), PRD §11.

/// Nodes store an index into the caller's item list.
pub struct BkTree {
    nodes: Vec<Node>,
}

struct Node {
    hash: u64,
    item: usize,
    /// (distance to this node, child node index)
    children: Vec<(u32, usize)>,
}

pub fn hamming(a: u64, b: u64) -> u32 {
    (a ^ b).count_ones()
}

impl BkTree {
    pub fn new() -> Self {
        Self { nodes: Vec::new() }
    }

    pub fn insert(&mut self, hash: u64, item: usize) {
        let new = self.nodes.len();
        self.nodes.push(Node {
            hash,
            item,
            children: Vec::new(),
        });
        if new == 0 {
            return;
        }
        let mut current = 0;
        loop {
            let d = hamming(self.nodes[current].hash, hash);
            match self.nodes[current].children.iter().find(|(cd, _)| *cd == d) {
                Some(&(_, child)) => current = child,
                None => {
                    self.nodes[current].children.push((d, new));
                    return;
                }
            }
        }
    }

    /// Items within `radius` of `hash`, with their distance.
    pub fn find(&self, hash: u64, radius: u32) -> Vec<(usize, u32)> {
        let mut out = Vec::new();
        if self.nodes.is_empty() {
            return out;
        }
        let mut stack = vec![0];
        while let Some(i) = stack.pop() {
            let node = &self.nodes[i];
            let d = hamming(node.hash, hash);
            if d <= radius {
                out.push((node.item, d));
            }
            // Triangle inequality: only children with |cd - d| <= radius can match.
            for &(cd, child) in &node.children {
                if cd + radius >= d && cd <= d + radius {
                    stack.push(child);
                }
            }
        }
        out
    }
}

impl Default for BkTree {
    fn default() -> Self {
        Self::new()
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn matches_brute_force() {
        // Pseudo-random hashes plus near copies.
        let mut hashes = Vec::new();
        let mut x: u64 = 0x9E37_79B9_7F4A_7C15;
        for i in 0..2000 {
            x ^= x << 13;
            x ^= x >> 7;
            x ^= x << 17;
            hashes.push(if i % 10 == 0 {
                hashes.last().copied().unwrap_or(x) ^ 0b1011
            } else {
                x
            });
        }
        let mut tree = BkTree::new();
        for (i, &h) in hashes.iter().enumerate() {
            tree.insert(h, i);
        }
        for radius in [0, 4, 12] {
            for q in hashes.iter().step_by(97) {
                let mut got: Vec<_> = tree.find(*q, radius);
                got.sort();
                let mut want: Vec<_> = hashes
                    .iter()
                    .enumerate()
                    .filter_map(|(i, &h)| (hamming(h, *q) <= radius).then_some((i, hamming(h, *q))))
                    .collect();
                want.sort();
                assert_eq!(got, want, "radius {radius}");
            }
        }
    }
}
