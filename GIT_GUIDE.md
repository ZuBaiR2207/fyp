# Complete Git & GitHub Guide - Learn in Detail

## Understanding Git Basics

### What is Git?
Git is a **version control system** that tracks changes in your code. Think of it like "Save Versions" in Word, but for code - you can see who changed what, when, and why. You can also go back to previous versions if something breaks.

### Three Places Your Code Lives:

```
┌─────────────────────────────────────────────────────────────────┐
│ 1. YOUR COMPUTER (Working Directory)                            │
│    ↓ (git add)                                                  │
│ 2. STAGING AREA (Holding Area - Ready to Commit)                │
│    ↓ (git commit)                                               │
│ 3. LOCAL REPOSITORY (.git folder - Your History)                │
│    ↓ (git push)                                                 │
│ 4. GITHUB (Remote - Backup & Collaboration)                     │
└─────────────────────────────────────────────────────────────────┘
```

---

## Section 1: Initial Setup

### Command: `git init`
**What it does:** Creates a new `.git` folder in your project directory. This folder stores all your version history and configuration.

**Why use it:** You only run this ONCE per project - it transforms a regular folder into a git repository.

**Syntax:**
```powershell
git init
```

**Real example:**
```powershell
cd 'd:\Final Year Project\Project'
git init
# Output: Initialized empty Git repository in D:/Final Year Project/Project/.git/
```

**What happened?** A hidden `.git` folder was created. This folder is where ALL git data is stored.

---

### Command: `git config`
**What it does:** Sets up your identity so git knows WHO is making changes.

**Why use it:** Every commit needs to know the author. This is for YOUR LOCAL COMPUTER ONLY (not global).

**Syntax:**
```powershell
git config user.name "Your Full Name"
git config user.email "your.email@example.com"
```

**Real example:**
```powershell
git config user.name "Ahmed Ali"
git config user.email "ahmed.ali@university.edu"
```

**Check your config:**
```powershell
git config --list
# Shows all your settings
```

**Important:** You can use `--global` to apply to ALL projects on your computer:
```powershell
git config --global user.name "Ahmed Ali"
git config --global user.email "ahmed.ali@university.edu"
```

---

## Section 2: Making Changes & Commits

### Command: `git status`
**What it does:** Shows you the current state of your working directory.

**Why use it:** Before committing, you want to know WHAT has changed.

**Syntax:**
```powershell
git status
```

**Real output example:**
```
On branch main

Changes not staged for commit:
  (use "git add <file>..." to stage the changes)
  (use "git restore <file>..." to discard changes in working directory)
        modified:   frontend/src/api/api.js
        modified:   frontend/src/pages/UniversityPortalPage.jsx

Untracked files:
  (use "git add <file>..." to include in what will be committed)
        GIT_GUIDE.md
```

**What this means:**
- **Modified files**: Changed files that haven't been staged yet
- **Untracked files**: New files git doesn't know about yet
- **Staged files**: Ready to be committed (would appear under "Changes to be committed")

---

### Command: `git add`
**What it does:** Moves files from "Working Directory" to "Staging Area" - telling git "I want to include this in my next commit"

**Why use it:** You might change 10 files but only want to commit 5 - `git add` lets you choose what to include.

**Syntax:**
```powershell
# Add a specific file
git add filename.txt

# Add all changes
git add .

# Add all .jsx files
git add *.jsx

# Add specific folder
git add frontend/
```

**Real examples:**

**Example 1: Add specific file**
```powershell
git add frontend/src/api/api.js
# Only api.js will be staged
```

**Example 2: Add all files**
```powershell
git add .
# All changed and new files will be staged
```

**Check what's staged:**
```powershell
git status
# Shows files in "Changes to be committed" section
```

---

### Command: `git commit`
**What it does:** Creates a permanent snapshot of your staged changes with a message describing what you changed and why.

**Why use it:** This creates a checkpoint you can go back to later.

**Syntax:**
```powershell
git commit -m "Your commit message describing the changes"
```

**Real examples:**

**Example 1: Simple commit**
```powershell
git commit -m "Fix: JWT token passing in portal pages"
```

**Example 2: Detailed commit (multi-line)**
```powershell
git commit -m "Feature: Add user management to university portal

- Added createUser() function
- Added deleteUser() function  
- Added edit user functionality
- All endpoints protected with @PreAuthorize"
```

**Example 3: Fix a commit message (if you made a typo)**
```powershell
git commit --amend -m "Fix: JWT token passing in portal pages"
# Replaces the last commit message
```

**Good commit messages:**
```
✅ Fix: JWT token not being sent
✅ Feature: Add announcement creation
✅ Refactor: Improve error handling in api.js
✅ Docs: Update README with setup instructions

❌ fixed stuff
❌ work in progress
❌ changes
❌ asdf
```

**Commit message format:**
```
[Type]: [Brief description] (50 chars max)

[Optional detailed explanation - explain WHY not WHAT]
```

---

### Command: `git log`
**What it does:** Shows you the history of all commits you've made.

**Why use it:** To see what you've done, when, and who did it.

**Syntax:**
```powershell
git log
git log --oneline
git log --oneline -5
git log --author="Ahmed"
git log --grep="JWT"
```

**Real examples:**

**Example 1: Show last 5 commits**
```powershell
git log --oneline -5
# Output:
# 3a2b1c0 Fix: JWT token passing in portal pages
# 2b1c0a9 Feature: Add @PreAuthorize annotations
# 1c0a9b8 Refactor: Update endpoint paths
# 0a9b8c7 Docs: Add bug fix report
# 9b8c7d6 Initial commit: FYP project
```

**Example 2: Find commits by specific person**
```powershell
git log --author="Ahmed" --oneline
```

**Example 3: Find commits mentioning JWT**
```powershell
git log --grep="JWT" --oneline
```

**Exit log view (if it opens in pager):**
```powershell
# Press 'q' to quit
```

---

## Section 3: Viewing Changes

### Command: `git diff`
**What it does:** Shows the actual line-by-line changes you made (not staged yet).

**Why use it:** Review your changes before staging to make sure you didn't break anything.

**Syntax:**
```powershell
# Show unstaged changes
git diff

# Show staged changes
git diff --staged

# Show changes in specific file
git diff filename.js

# Show changes between branches
git diff main develop
```

**Real output example:**
```
diff --git a/frontend/src/pages/UniversityPortalPage.jsx b/frontend/src/pages/UniversityPortalPage.jsx
index 1234567..abcdefg 100644
--- a/frontend/src/pages/UniversityPortalPage.jsx
+++ b/frontend/src/pages/UniversityPortalPage.jsx
@@ -20,7 +20,7 @@ const NAV = [
 export default function UniversityPortalPage() {
-  const { username, password, logout, role } = useAuth()
-  const auth = { username, password }
+  const { token, logout, role } = useAuth()
+  const auth = { token }
   const { statusEvents, chatMessages } = useRealtime()
```

**What the symbols mean:**
- `-` (red): Line removed
- `+` (green): Line added
- ` ` (white): Line unchanged (for context)
- `@@ -20,7 +20,7 @@`: Shows line numbers (starting at line 20, showing 7 lines)

---

## Section 4: Branches - Working Safely

### What are Branches?
Think of branches as parallel universes for your code. You can create a copy of your project, make changes safely, then merge it back when it's working.

```
        feature/jwt-fix
       /                 \
main---○---○---○---○---○---X---merge---○
```

### Command: `git branch`
**What it does:** Creates, lists, or deletes branches.

**Why use it:** Each developer works on their own branch so they don't break the main code.

**Syntax:**
```powershell
# List all branches
git branch

# List all branches including remote
git branch -a

# Create new branch
git branch feature/users-list

# Delete branch
git branch -d feature/users-list

# Delete branch forcefully
git branch -D feature/users-list
```

**Real examples:**

**Example 1: Create a feature branch**
```powershell
git branch feature/jwt-fix
# Creates new branch based on current branch
```

**Example 2: See all branches**
```powershell
git branch -a
# Output:
#   feature/jwt-fix
# * main
#   develop
#   remotes/origin/main
#   remotes/origin/develop
```

**The `*` means you're currently on that branch**

---

### Command: `git checkout`
**What it does:** Switches to a different branch.

**Why use it:** To move between different branches and work on different features.

**Syntax:**
```powershell
# Switch to existing branch
git checkout branch-name

# Create AND switch to new branch (shortcut)
git checkout -b feature/jwt-fix
```

**Real examples:**

**Example 1: Switch to main branch**
```powershell
git checkout main
# Your files change to match the main branch
```

**Example 2: Create and switch to new feature branch**
```powershell
git checkout -b feature/jwt-fix
# Creates "feature/jwt-fix" and switches to it immediately
```

**Verify you switched:**
```powershell
git status
# Shows: On branch feature/jwt-fix
```

---

### Command: `git merge`
**What it does:** Combines changes from one branch into another.

**Why use it:** When your feature is done and tested, merge it back to main.

**Syntax:**
```powershell
# Make sure you're on the branch you want to merge INTO
git checkout main

# Then merge the feature branch
git merge feature/jwt-fix
```

**Real example:**
```powershell
# You're on feature/jwt-fix, made changes
git add .
git commit -m "Fix: JWT token passing"

# Switch to main
git checkout main

# Merge your feature into main
git merge feature/jwt-fix
# Output: Fast-forward
#  frontend/src/pages/UniversityPortalPage.jsx | 2 +-
#  1 file changed, 1 insertion(+), 1 deletion(-)

# Optionally delete the feature branch
git branch -d feature/jwt-fix
```

**What is "Fast-forward"?** It means your feature branch was directly ahead of main, so it just moves the pointer. No conflicts!

---

## Section 5: Working with GitHub (Remote)

### Command: `git remote`
**What it does:** Manages connections to remote repositories (like GitHub).

**Why use it:** GitHub is your backup and allows collaboration.

**Syntax:**
```powershell
# List all remotes
git remote -v

# Add new remote
git remote add origin https://github.com/USERNAME/fyp-project.git

# Remove remote
git remote remove origin

# Change remote URL
git remote set-url origin https://github.com/USERNAME/new-name.git
```

**Real examples:**

**Example 1: Add GitHub as remote**
```powershell
git remote add origin https://github.com/ahmedali/fyp-project.git
# "origin" is the standard name for your main remote
```

**Example 2: See all remotes**
```powershell
git remote -v
# Output:
# origin  https://github.com/ahmedali/fyp-project.git (fetch)
# origin  https://github.com/ahmedali/fyp-project.git (push)
```

---

### Command: `git push`
**What it does:** Uploads your commits from local computer to GitHub.

**Why use it:** Backup your code and share it with team members.

**Syntax:**
```powershell
# Push current branch to remote
git push

# Push specific branch
git push origin main

# Push all branches
git push --all

# Push with force (use with caution!)
git push --force
```

**Real example - First time pushing:**
```powershell
# First, set up your local branch to track remote
git push -u origin main
# -u means "set upstream" - tells git: "main on my computer = main on GitHub"
```

**Real example - Regular push:**
```powershell
git push
# Uploads changes to GitHub
```

**What happened:**
```
Your Computer          →    GitHub
main (3 commits)       →    main (3 commits)
                  UPLOADED!
```

---

### Command: `git pull`
**What it does:** Downloads changes from GitHub to your computer.

**Why use it:** Get updates that teammates pushed, or sync from another computer.

**Syntax:**
```powershell
# Pull current branch
git pull

# Pull specific branch
git pull origin main

# Pull but don't auto-merge
git pull --no-commit
```

**Real example:**

**Scenario:** Your teammate pushed changes to GitHub
```powershell
git pull
# Output:
# remote: Counting objects: 5, done.
# Receiving objects: 100% (5/5), 456 bytes | 456.00 KiB/s, done.
# Updating 1a2b3c4..5d6e7f8
# Fast-forward
#  frontend/src/api/api.js | 10 +++++-----
#  1 file changed, 5 insertions(+), 5 deletions(-)
```

**What happened:**
```
GitHub                 →    Your Computer
main (3 commits)       →    main (3 commits)
                  DOWNLOADED!
```

---

### Command: `git fetch`
**What it does:** Downloads updates from GitHub but doesn't merge them into your code.

**Why use it:** See what changed on GitHub without affecting your local code yet.

**Syntax:**
```powershell
git fetch
git fetch origin
git fetch --all
```

**Real example:**

```powershell
git fetch
# Shows what's on GitHub

git status
# Output: Your branch is behind 'origin/main' by 2 commits.

# Now decide if you want to merge
git merge origin/main
```

**Difference between `fetch` and `pull`:**
```
git fetch  = Download only (safe)
git pull   = Download + Merge automatically (faster)
```

---

## Section 6: Undoing Changes

### Command: `git restore`
**What it does:** Discards changes to a file (goes back to last commit).

**Why use it:** Oops! You changed something and want to undo it.

**Syntax:**
```powershell
# Restore specific file to last commit
git restore filename.js

# Restore all files
git restore .

# Restore a file from a specific commit
git restore --source=abc123 filename.js
```

**Real example:**

```powershell
# You accidentally edited api.js
git status
# Shows: modified:   frontend/src/api/api.js

# Undo the changes
git restore frontend/src/api/api.js

git status
# Shows: nothing to commit, clean working directory
```

---

### Command: `git reset`
**What it does:** Unstages files or goes back to a previous commit.

**Why use it:** You staged files by mistake, or want to undo the last commit.

**Syntax:**
```powershell
# Unstage a file (remove from staging area)
git reset filename.js

# Unstage all files
git reset

# Undo last commit (keep changes)
git reset --soft HEAD~1

# Undo last commit (lose changes) - DANGEROUS!
git reset --hard HEAD~1

# Go back N commits
git reset --soft HEAD~3
```

**Real examples:**

**Example 1: Unstage a file**
```powershell
git add api.js AuthContext.jsx
git status
# Shows both staged

git reset AuthContext.jsx
git status
# api.js still staged, AuthContext.jsx not staged
```

**Example 2: Undo last commit but keep your code**
```powershell
git commit -m "Wrong message"
git reset --soft HEAD~1
# Commit undone, but your files still changed and staged
git commit -m "Correct message"
```

**Example 3: Undo last 2 commits COMPLETELY**
```powershell
git reset --hard HEAD~2
# Goes back 2 commits, loses all changes - CAREFUL!
```

---

### Command: `git revert`
**What it does:** Creates a NEW commit that undoes a previous commit. Safer than reset.

**Why use it:** Undo something without losing history (better for shared code).

**Syntax:**
```powershell
git revert abc123
# Creates new commit that undoes commit abc123
```

**Real example:**

```powershell
git log --oneline
# 3a2b1c0 Fix: JWT token
# 2b1c0a9 Feature: Users endpoint
# 1c0a9b8 Initial commit

# Oops, the "Fix: JWT token" broke something
git revert 3a2b1c0
# Creates a NEW commit that undoes 3a2b1c0
# History now shows:
# 4d3c2b1 Revert "Fix: JWT token"
# 3a2b1c0 Fix: JWT token
# 2b1c0a9 Feature: Users endpoint
```

---

## Section 7: Working with .gitignore

### What is .gitignore?
A file that tells git what files to IGNORE and not track.

**Why use it:** You don't want to commit node_modules, .env, build files, etc.

**Create .gitignore file:**
```powershell
# In your project root, create a text file named ".gitignore"
cd 'd:\Final Year Project\Project'
New-Item -Name ".gitignore" -ItemType File
# Then edit it with your editor
```

**Example .gitignore content:**
```
# Node
node_modules/
npm-debug.log
yarn-error.log
package-lock.json

# Maven
target/
*.jar
*.class

# IDE
.vscode/
.idea/
*.iml
.DS_Store

# Environment
.env
.env.local
.env.*.local

# OS
Thumbs.db
.DS_Store

# Build
dist/
build/
```

**Check what git will track:**
```powershell
git status --ignored
# Shows ignored files
```

---

## Section 8: Workflow Examples

### Example 1: First Time Setup
```powershell
# 1. Initialize git
cd 'd:\Final Year Project\Project'
git init

# 2. Configure user
git config user.name "Your Name"
git config user.email "your@email.com"

# 3. Create .gitignore
# (create file as shown above)

# 4. Stage everything
git add .

# 5. Make first commit
git commit -m "Initial commit: FYP project structure"

# 6. Add GitHub remote
git remote add origin https://github.com/YOUR_USERNAME/fyp-project.git

# 7. Push to GitHub
git branch -M main
git push -u origin main
```

---

### Example 2: Daily Workflow
```powershell
# Morning: Get latest code from team
git pull

# Work on a feature (create branch first)
git checkout -b feature/jwt-fix

# Make changes in your editor...

# Check what changed
git status

# Review changes
git diff

# Stage your changes
git add .

# Commit with clear message
git commit -m "Fix: JWT token not being sent to API endpoints

- Changed useAuth destructuring from (username, password) to (token)
- Updated apiFetch to properly include Authorization header
- Tested with admin user login"

# Push to GitHub
git push -u origin feature/jwt-fix

# Go to GitHub, create Pull Request (PR)
# Team reviews your code
# If approved, merge PR

# Back on your computer:
git checkout main
git pull
git branch -d feature/jwt-fix
```

---

### Example 3: Fixing a Mistake
```powershell
# You made a commit with a typo
git log --oneline
# 3a2b1c0 Fxi: JWT token  ← TYPO!

# Option 1: Fix the message
git commit --amend -m "Fix: JWT token"

# Or Option 2: Undo and redo
git reset --soft HEAD~1
git commit -m "Fix: JWT token"

# Then push
git push
```

---

### Example 4: Sync with Team
```powershell
# Check what's on GitHub
git fetch

# See if you're behind
git status
# Output: Your branch is behind 'origin/main' by 3 commits.

# Download and merge team changes
git pull

# Check for conflicts (if any)
git status

# Resolve conflicts (edit files)

# Stage resolved files
git add .

# Complete the merge
git commit -m "Merge: Pull latest changes from main"

# Continue working
```

---

## Section 9: Common Commands Quick Reference

```powershell
# Setup (first time)
git init
git config user.name "Name"
git config user.email "email@example.com"
git remote add origin <github-url>

# Daily work
git status              # See what changed
git diff                # See actual changes
git add .               # Stage everything
git commit -m "message" # Create checkpoint
git push                # Upload to GitHub
git pull                # Download from GitHub

# Branches
git branch                  # List branches
git checkout -b feature     # Create and switch
git merge feature            # Combine branches
git branch -d feature        # Delete branch

# Undo
git restore filename        # Discard changes
git reset --soft HEAD~1     # Undo last commit
git revert abc123           # Undo specific commit

# History
git log --oneline          # See commits
git diff main develop      # Compare branches
```

---

## Section 10: Important Concepts Explained

### HEAD
**What is it?** A pointer to your current location in git history.

```
main → HEAD → Latest commit
         ↓
    3a2b1c0 (current position)
```

- `HEAD` = where you are now
- `HEAD~1` = 1 commit back
- `HEAD~3` = 3 commits back

---

### Origin
**What is it?** The standard name for your GitHub remote.

```
Your Computer (local)  ←→  GitHub (origin)
  "git reset"              "git push/pull"
```

---

### Branch Tracking
**What is it?** Your local branch knows which GitHub branch it's connected to.

```powershell
git push -u origin main
# -u = "--set-upstream"
# Tells git: "local main" = "GitHub main"
```

After this:
- `git push` = push to origin/main
- `git pull` = pull from origin/main

---

### Merge vs Rebase
**Merge:** Creates a "merge commit" - keeps all history
```
develop ──────────┐
         ↓        ├─ Merge commit
main ────────────────
```

**Rebase:** Rewrites history - cleaner but dangerous for shared code
```
Avoid for now! Just use merge.
```

---

## Tips for Success

✅ **DO:**
- Commit often (every completed feature)
- Write clear commit messages
- Pull before you push
- Use branches for features
- Review changes before committing

❌ **DON'T:**
- Commit node_modules or build files
- Use `--force` unless you really know what you're doing
- Work directly on main (use feature branches)
- Skip writing commit messages
- Commit large binary files (> 100MB)

---

## Need Help?

```powershell
# See help for any command
git help commit
git commit --help

# Or check online
# https://git-scm.com/docs
```

---

**Now you understand git!** Practice these commands a few times and they'll become muscle memory. The most important thing is that you have a backup of your code on GitHub! 🎉
