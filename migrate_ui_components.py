#!/usr/bin/env python3
"""
Script to migrate UI components from client to frontend with path fixes
"""
import os
import re
from pathlib import Path

# Source and destination directories
SOURCE_DIR = Path("client/src/components/ui")
DEST_DIR = Path("frontend/app/components/ui")

# Path replacements
PATH_REPLACEMENTS = [
    (r'from "@/lib/utils"', r'from "@/app/lib/utils"'),
    (r'from "@/components/ui/', r'from "@/app/components/ui/'),
    (r'from "@/hooks/', r'from "@/app/hooks/'),
]

def migrate_component(source_file: Path, dest_file: Path):
    """Migrate a single component file with path fixes"""
    print(f"Migrating {source_file.name}...")
    
    # Read source file
    with open(source_file, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Apply path replacements
    for old_path, new_path in PATH_REPLACEMENTS:
        content = re.sub(old_path, new_path, content)
    
    # Write to destination
    with open(dest_file, 'w', encoding='utf-8') as f:
        f.write(content)
    
    print(f"  ✓ Created {dest_file.name}")

def main():
    """Main migration function"""
    if not SOURCE_DIR.exists():
        print(f"Error: Source directory {SOURCE_DIR} not found")
        return
    
    # Create destination directory if it doesn't exist
    DEST_DIR.mkdir(parents=True, exist_ok=True)
    
    # Get all .tsx files from source
    source_files = list(SOURCE_DIR.glob("*.tsx"))
    
    print(f"Found {len(source_files)} components to migrate\n")
    
    migrated = 0
    skipped = 0
    
    for source_file in source_files:
        dest_file = DEST_DIR / source_file.name
        
        # Skip if already exists (don't overwrite manually created ones)
        if dest_file.exists():
            print(f"Skipping {source_file.name} (already exists)")
            skipped += 1
            continue
        
        try:
            migrate_component(source_file, dest_file)
            migrated += 1
        except Exception as e:
            print(f"  ✗ Error migrating {source_file.name}: {e}")
    
    print(f"\n{'='*50}")
    print(f"Migration complete!")
    print(f"  Migrated: {migrated}")
    print(f"  Skipped: {skipped}")
    print(f"  Total: {len(source_files)}")
    print(f"{'='*50}")

if __name__ == "__main__":
    main()
