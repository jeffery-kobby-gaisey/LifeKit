$ErrorActionPreference = 'Continue'

# Kill any stuck processes
taskkill /F /IM vim.exe 2>$null
taskkill /F /IM gvim.exe 2>$null
taskkill /F /IM notepad.exe 2>$null

# Navigate to project
cd "d:\New folder (2)"

# Clean up git state
if (Test-Path .git\rebase-merge) {
    Remove-Item .git\rebase-merge -Recurse -Force -ErrorAction SilentlyContinue
    Write-Host "Cleaned rebase-merge directory"
}

if (Test-Path .git\.COMMIT_EDITMSG.swp) {
    Remove-Item .git\.COMMIT_EDITMSG.swp -Force -ErrorAction SilentlyContinue
    Write-Host "Removed swap file"
}

# Check git status
git status

# Push to GitHub
Write-Host "Pushing to GitHub..."
git push -u origin main --force

Write-Host "Done!"
