# 🤖 Autonomous Project Orchestrator

## Mission
Complete the **Verified Video** project by processing all tasks in `tasks.json` until the application is fully functional and production-ready.

## Core Rules (ALWAYS follow these)

### 1. **Read State Files First**
```
EVERY session must start by:
1. Reading project_state.json
2. Reading tasks.json
3. Understanding current status
```

### 2. **Process Tasks Systematically**
```
FOR EACH task in tasks.json:
1. Read the task details
2. Assign to correct agent
3. Agent completes the work
4. Run quality checks
5. Update tasks.json status
6. Move to next task
```

### 3. **Quality Checks After Every Change**
```
Frontend changes:
  → npm run build
  → npm run type-check
  → npm test

Backend changes:
  → pytest
  → pytest --cov

NEVER skip quality checks!
```

### 4. **Handle Failures**
```
IF tests fail:
  → Send to debugger agent
  → Debugger fixes issue
  → Retest automatically
  → Update tasks.json

IF build fails:
  → Investigate error
  → Fix root cause
  → Rebuild
  → Verify success
```

### 5. **Update State Continuously**
```
After EVERY completed task:
  → Mark task as "complete" in tasks.json
  → Update project_state.json
  → Update completion_percentage
  → Add to completed_tasks list
```

### 6. **Never Stop Prematurely**
```
Continue processing until:
  ✅ All tasks marked as "complete"
  ✅ All tests passing
  ✅ Build succeeding
  ✅ No failures remaining

Only stop when:
  - tasks.json shows all "complete"
  - project_state.json shows 100% completion
  - User explicitly says STOP
```

## Agent Assignments

| Agent | Tasks | Files |
|-------|-------|-------|
| **Frontend** | UI/UX, responsive design, components | `src/**` |
| **Backend** | APIs, database, auth, WebSocket | `backend/**` |
| **Tester** | Run tests, verify builds, QA | test results |
| **Debugger** | Fix failures, analyze errors | any |
| **Researcher** | Audit code, find issues, analyze | any |

## Workflow

```
┌─────────────────────────────────┐
│ Read project_state.json         │
│ Read tasks.json                 │
└────────┬────────────────────────┘
         │
         ▼
┌─────────────────────────────────┐
│ Find next task with status=todo │
└────────┬────────────────────────┘
         │
         ▼
┌─────────────────────────────────┐
│ Assign to correct agent         │
│ (frontend/backend/test/debug)   │
└────────┬────────────────────────┘
         │
         ▼
┌─────────────────────────────────┐
│ Agent completes work            │
│ (code, config, etc.)            │
└────────┬────────────────────────┘
         │
         ▼
┌─────────────────────────────────┐
│ Run quality checks              │
│ (build, tests, type checks)     │
└────────┬────────────────────────┘
         │
      ┌──┴──┐
      │     │
    ✅      ❌
    │       │
    │       ▼
    │   ┌────────────────────┐
    │   │ Send to Debugger   │
    │   │ Fix & retest       │
    │   └────────┬───────────┘
    │            │
    │            ▼
    │        ✅ Success?
    │        │
    └────────┴───────────┐
             │
             ▼
    ┌─────────────────────────────────┐
    │ Update tasks.json               │
    │ - status = "complete"           │
    │ - Update project_state.json     │
    └────────┬────────────────────────┘
             │
             ▼
    ┌─────────────────────────────────┐
    │ More tasks to do?               │
    └────────┬────────────────────────┘
             │
          ┌──┴──┐
          │     │
         YES   NO
          │     │
          │     ▼
          │   🎉 PROJECT COMPLETE!
          │   (All tests passing)
          │
          └─────→ Continue to next task

```

## Getting Started

When you first run this, tell Claude Code:

```
Read CLAUDE.md and analyze the entire project.

Use the agents framework to:

1. Process tasks.json one by one
2. Assign each task to the correct agent
3. Run quality checks after changes
4. Fix any failures with debugger agent
5. Update project_state.json continuously

Work through all 25 tasks until the project is complete.

Start with HIGH PRIORITY tasks first.
```

## Monitoring Progress

Check `project_state.json` anytime to see:
- Current completion percentage
- Completed tasks
- Failed tasks
- Build/test status
- Last updated timestamp

## Key Files

```
tasks.json            ← What to do
project_state.json    ← How far we've come
agents/
  ├── orchestrator.md ← This system
  ├── frontend.md     ← React/TypeScript agent
  ├── backend.md      ← Python/FastAPI agent
  ├── tester.md       ← QA verification agent
  ├── debugger.md     ← Fix failures agent
  └── researcher.md   ← Investigation agent
```

## Success Criteria

Project is complete when:

✅ All 25 tasks marked as "complete"  
✅ No failing tests  
✅ Production build succeeds  
✅ TypeScript checks pass  
✅ Backend tests pass  
✅ App runs without errors  
✅ All pages responsive  
✅ Login/auth working  
✅ Video watching working  
✅ Real-time tracking working  

## Important Rules

- ⚠️ **Never skip tasks** — complete all 25
- ⚠️ **Never skip testing** — run after every change
- ⚠️ **Never ignore failures** — use debugger to fix
- ⚠️ **Never modify this file** — it's the master blueprint
- ⚠️ **Always update state** — keep progress tracked

---

**Created:** 2026-06-24  
**Status:** Ready to begin  
**Next Step:** Read this file, then start processing tasks.json  
