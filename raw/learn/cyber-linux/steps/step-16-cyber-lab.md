# Step 16 (שלב 16) — Building a Cyber Lab

Stage D. Goal: two isolated VMs (attacker and target) with snapshots and no exposure to a public network.

## Learn

- Hypervisors: VirtualBox, VMware, KVM/libvirt.
- Network modes: **NAT** (can reach out), **bridged** (on your real LAN, avoid), **host-only** and **internal** (isolated).
- Snapshots: save and restore a VM state.
- Machines: attacker (Kali), target (Ubuntu Server you configure, or an intentionally vulnerable training VM).

## Guided exercise

1. Create a host-only network (VirtualBox: Tools > Network > Host-only, DHCP off, e.g. `192.168.56.0/24`).
2. Install the target VM (Ubuntu Server). Attach **only** the host-only adapter. Set a static address, e.g. `192.168.56.101`.
3. Install the attacker VM (Kali). Attach only the host-only adapter, `192.168.56.102`.
4. Verify isolation:
   - `ping 192.168.56.101` from the attacker: works.
   - `ping 8.8.8.8` from both: fails.
5. Take a snapshot of both: `VBoxManage snapshot "target" take "clean-install"`.
6. Break something on the target, restore the snapshot, confirm it is back.

## What good looks like

- The VMs reach each other and nothing else.
- You can restore to a clean state in under a minute.

## Pitfalls

- A second adapter in NAT or bridged mode defeats the isolation. Check every adapter.
- Shared folders and clipboard sharing weaken isolation; disable them for vulnerable VMs.
- Install updates on the VMs while online, then switch to host-only and snapshot.

## Daily summary prompts

Draw the lab network (names, addresses, adapters) and write how you verified isolation.

## Review questions

1. Why use host-only instead of bridged networking?
2. What does a snapshot not protect you from?
3. How do you prove the lab cannot reach the internet?
