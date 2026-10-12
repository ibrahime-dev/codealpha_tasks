"use strict";

(() => {
  const api = window.TaskFlow;

  if (!api?.requireSession()) {
    return;
  }

  const user = api.readUser();
  if (!user?.id) {
    api.clearSession();
    window.location.replace("login.html");
    return;
  }

  const projectId = new URLSearchParams(window.location.search).get("id");
  const taskDialog = document.getElementById("task-dialog");
  const taskForm = document.getElementById("task-form");
  const taskError = document.getElementById("task-form-error");
  const taskSubmit = document.getElementById("task-submit-button");
  const commentsDialog = document.getElementById("comments-dialog");
  const commentsList = document.getElementById("comments-list");
  const commentForm = document.getElementById("comment-form");
  const commentError = document.getElementById("comment-form-error");
  const commentSubmit = document.getElementById("comment-submit-button");
  const memberForm = document.getElementById("member-form");
  const memberFormError = document.getElementById("member-form-error");
  const memberSubmit = document.getElementById("member-submit-button");
  const tasks = new Map();
  let project = null;
  let activeCommentTaskId = null;

  const isOwner = () => {
    const ownerId = typeof project?.owner === "object" ? project.owner?._id : project?.owner;
    return String(ownerId) === String(user.id);
  };

  const setProfile = () => {
    const name = user.name || "TaskFlow member";
    document.getElementById("profile-name").textContent = name;
    document.getElementById("profile-email").textContent = user.email || "";
    document.getElementById("profile-avatar").textContent = api.getInitials(name);
  };

  const showLoadError = (message) => {
    api.showPageError(message);
    document.getElementById("project-title").textContent = "Project unavailable";
    document.getElementById("project-description").textContent = "";
    document.getElementById("new-task-button").disabled = true;
  };

  const loadProject = async () => {
    if (!projectId || !/^[a-f\d]{24}$/i.test(projectId)) {
      throw new Error("This project link is missing a valid project ID. Return to the dashboard and open a project.");
    }

    const result = await api.request(`/projects/${encodeURIComponent(projectId)}`);
    if (!result?.project?._id) {
      throw new Error("The server returned an unexpected project response.");
    }

    project = result.project;
    document.title = `${project.name} — TaskFlow`;
    document.getElementById("project-title").textContent = project.name;
    document.getElementById("breadcrumb-project").textContent = project.name;
    document.getElementById("project-description").textContent = project.description || "A focused space for your team's work.";
    document.getElementById("owner-badge").hidden = !isOwner();
    document.getElementById("team-panel").hidden = !isOwner();
    renderTeam();
    fillAssigneeOptions();
  };

  const renderTeam = () => {
    const teamList = document.getElementById("team-list");
    if (!teamList || !project) {
      return;
    }

    const owner = project.owner && typeof project.owner === "object" ? project.owner : null;
    const ownerChip = owner
      ? `<span class="team-chip">${api.escapeHtml(owner.name || owner.email || "Project owner")} <span class="team-chip-label">Owner</span></span>`
      : "";
    const memberChips = (project.members || [])
      .filter((member) => member && typeof member === "object")
      .map((member) => `
        <span class="team-chip">
          ${api.escapeHtml(member.name || member.email || "Project member")}
          <button class="team-chip-remove" type="button" data-remove-member="${api.escapeHtml(member._id)}" aria-label="Remove ${api.escapeHtml(member.name || member.email || "member")}">×</button>
        </span>`)
      .join("");

    teamList.innerHTML = ownerChip + memberChips;
  };

  const fillAssigneeOptions = (selectedId = "") => {
    const select = document.getElementById("task-assignee");
    const people = [];
    const owner = project?.owner;

    if (owner && typeof owner === "object") {
      people.push(owner);
    }

    if (Array.isArray(project?.members)) {
      people.push(...project.members.filter((member) => member && typeof member === "object"));
    }

    const uniquePeople = [...new Map(people.map((person) => [String(person._id), person])).values()];
    select.innerHTML = '<option value="">Unassigned</option>' + uniquePeople.map((person) => {
      const id = api.escapeHtml(person._id);
      const name = api.escapeHtml(person.name || person.email || "Project member");
      const selected = String(person._id) === String(selectedId) ? " selected" : "";
      return `<option value="${id}"${selected}>${name}</option>`;
    }).join("");
  };

  const formatDueDate = (value) => {
    if (!value) {
      return "";
    }

    const dateOnly = String(value).slice(0, 10);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dateOnly)) {
      return "";
    }

    const date = new Date(`${dateOnly}T00:00:00.000Z`);
    if (Number.isNaN(date.getTime())) {
      return "";
    }

    const today = new Date().toISOString().slice(0, 10);
    const isPastDue = dateOnly < today;
    const label = new Intl.DateTimeFormat(undefined, {
      month: "short",
      day: "numeric",
      timeZone: "UTC"
    }).format(date);
    return `<span class="task-due${isPastDue ? " is-overdue" : ""}">${isPastDue ? "Overdue · " : "Due "}${api.escapeHtml(label)}</span>`;
  };

  const renderTask = (task) => {
    const taskId = api.escapeHtml(task._id);
    const safeTitle = api.escapeHtml(task.title);
    const description = task.description
      ? `<p class="task-description">${api.escapeHtml(task.description)}</p>`
      : "";
    const assignee = task.assignedTo && typeof task.assignedTo === "object"
      ? `<span class="task-meta-left"><span class="avatar avatar-small" aria-hidden="true">${api.getInitials(task.assignedTo.name)}</span><span>${api.escapeHtml(task.assignedTo.name || "Assigned")}</span></span>`
      : `<span class="task-meta-left"><span class="avatar avatar-small" aria-hidden="true">–</span><span>Unassigned</span></span>`;
    const deleteButton = isOwner()
      ? `<button class="text-button is-danger" type="button" data-task-action="delete" data-task-id="${taskId}" aria-label="Delete ${safeTitle}">Delete</button>`
      : "";
    const statuses = [
      ["todo", "To Do"],
      ["inProgress", "In Progress"],
      ["done", "Done"]
    ];
    const statusOptions = statuses.map(([value, label]) => {
      const selected = value === task.status ? " selected" : "";
      return `<option value="${value}"${selected}>${label}</option>`;
    }).join("");

    return `
      <article class="task-card" draggable="true" data-task-id="${taskId}">
        <div class="task-card-top">
          <h4 class="task-title">${safeTitle}</h4>
          <span class="sr-only">Drag to move this task to another status.</span>
        </div>
        ${description}
        <div class="task-meta">
          ${assignee}
          ${formatDueDate(task.dueDate)}
        </div>
        <div class="task-card-actions">
          <select class="task-status-select" data-task-status="${taskId}" aria-label="Status for ${safeTitle}">
            ${statusOptions}
          </select>
          <button class="task-comment-button" type="button" data-task-action="comments" data-task-id="${taskId}">Comments</button>
        </div>
        <div class="task-card-actions">
          <button class="text-button" type="button" data-task-action="edit" data-task-id="${taskId}">Edit task</button>
          ${deleteButton}
        </div>
      </article>`;
  };

  const renderBoard = (taskList) => {
    tasks.clear();
    taskList.forEach((task) => tasks.set(String(task._id), task));

    const statuses = ["todo", "inProgress", "done"];
    for (const status of statuses) {
      const columnTasks = taskList.filter((task) => task.status === status);
      document.getElementById(`count-${status}`).textContent = String(columnTasks.length);
      document.getElementById(`list-${status}`).innerHTML = columnTasks.length
        ? columnTasks.map(renderTask).join("")
        : `<div class="comment-empty">No tasks here yet.</div>`;
    }

    const completed = taskList.filter((task) => task.status === "done").length;
    const completion = taskList.length ? Math.round((completed / taskList.length) * 100) : 0;
    document.getElementById("board-summary").textContent =
      `${taskList.length} ${taskList.length === 1 ? "task" : "tasks"} · ${completion}% complete`;
  };

  const loadTasks = async () => {
    const result = await api.request(`/projects/${encodeURIComponent(projectId)}/tasks`);
    if (!Array.isArray(result?.tasks)) {
      throw new Error("The server returned an unexpected task response.");
    }

    renderBoard(result.tasks);
  };

  const reloadBoard = async () => {
    try {
      await loadTasks();
    } catch (error) {
      api.showPageError(error.message);
    }
  };

  const openTaskForm = (task = null) => {
    taskForm.reset();
    taskError.textContent = "";
    const editing = Boolean(task);
    document.getElementById("task-dialog-title").textContent = editing ? "Edit task" : "Add a task";
    document.getElementById("task-id").value = task?._id || "";
    document.getElementById("task-title").value = task?.title || "";
    document.getElementById("task-description").value = task?.description || "";
    document.getElementById("task-due-date").value = task?.dueDate
      ? new Date(task.dueDate).toISOString().slice(0, 10)
      : "";
    fillAssigneeOptions(
      task?.assignedTo && typeof task.assignedTo === "object" ? task.assignedTo._id : task?.assignedTo || ""
    );
    taskSubmit.textContent = editing ? "Save changes" : "Add task";
    taskDialog.showModal();
    document.getElementById("task-title").focus();
  };

  const postTaskStatus = async (taskId, status) => {
    const task = tasks.get(taskId);
    if (!task || !["todo", "inProgress", "done"].includes(status)) {
      api.showToast("That task status is not valid.", true);
      return;
    }

    try {
      await api.request(`/tasks/${encodeURIComponent(taskId)}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status })
      });
      await loadTasks();
    } catch (error) {
      api.showToast(error.message, true);
      await reloadBoard();
    }
  };

  const handleTaskAction = async (event) => {
    const button = event.target.closest("[data-task-action]");
    if (!button) {
      return;
    }

    const task = tasks.get(button.dataset.taskId);
    if (!task) {
      api.showToast("That task is no longer available. Refresh the board.", true);
      return;
    }

    if (button.dataset.taskAction === "edit") {
      openTaskForm(task);
      return;
    }

    if (button.dataset.taskAction === "comments") {
      await openComments(task);
      return;
    }

    if (button.dataset.taskAction === "delete") {
      if (!isOwner()) {
        api.showToast("Only the project owner can delete tasks.", true);
        return;
      }

      if (!window.confirm(`Delete "${task.title}" and its comments? This cannot be undone.`)) {
        return;
      }

      button.disabled = true;
      try {
        await api.request(`/tasks/${encodeURIComponent(task._id)}`, { method: "DELETE" });
        api.showToast("Task deleted.");
        await loadTasks();
      } catch (error) {
        button.disabled = false;
        api.showToast(error.message, true);
      }
    }
  };

  const renderComments = (commentList) => {
    if (commentList.length === 0) {
      commentsList.innerHTML = '<div class="comment-empty">No comments yet. Start the conversation.</div>';
      return;
    }

    commentsList.innerHTML = commentList.map((comment) => {
      const author = comment.user && typeof comment.user === "object"
        ? comment.user.name || comment.user.email || "TaskFlow member"
        : "TaskFlow member";
      return `
        <article class="comment-item">
          <div class="comment-header">
            <span class="comment-author">${api.escapeHtml(author)}</span>
            <time class="comment-date" datetime="${api.escapeHtml(comment.createdAt || "")}">${api.escapeHtml(api.formatDate(comment.createdAt, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }))}</time>
          </div>
          <p class="comment-text">${api.escapeHtml(comment.text)}</p>
        </article>`;
    }).join("");
  };

  const loadComments = async () => {
    if (!activeCommentTaskId) {
      throw new Error("Choose a task before loading its comments.");
    }

    const result = await api.request(`/tasks/${encodeURIComponent(activeCommentTaskId)}/comments`);
    if (!Array.isArray(result?.comments)) {
      throw new Error("The server returned an unexpected comments response.");
    }

    renderComments(result.comments);
  };

  const openComments = async (task) => {
    activeCommentTaskId = String(task._id);
    document.getElementById("comments-task-title").textContent = task.title;
    commentsList.innerHTML = '<div class="comment-empty">Loading comments…</div>';
    commentError.textContent = "";
    commentForm.reset();
    commentsDialog.showModal();

    try {
      await loadComments();
    } catch (error) {
      commentsList.innerHTML = "";
      commentError.textContent = error.message;
    }
  };

  document.getElementById("new-task-button").addEventListener("click", () => openTaskForm());
  document.getElementById("logout-button").addEventListener("click", () => {
    api.clearSession();
    window.location.assign("login.html");
  });

  memberForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    memberFormError.textContent = "";
    memberSubmit.disabled = true;
    memberSubmit.textContent = "Adding…";

    try {
      const result = await api.request(`/projects/${encodeURIComponent(projectId)}/members`, {
        method: "POST",
        body: JSON.stringify({ email: document.getElementById("member-email").value.trim() })
      });

      if (!result?.project?._id) {
        throw new Error("The server returned an unexpected project response.");
      }

      project = result.project;
      memberForm.reset();
      renderTeam();
      fillAssigneeOptions();
      api.showToast("Teammate added to the project.");
    } catch (error) {
      memberFormError.textContent = error.message;
    } finally {
      memberSubmit.disabled = false;
      memberSubmit.textContent = "Add";
    }
  });

  document.getElementById("team-list").addEventListener("click", async (event) => {
    const removeButton = event.target.closest("[data-remove-member]");
    if (!removeButton) {
      return;
    }

    const memberId = removeButton.dataset.removeMember;
    const member = project.members.find((person) => String(person._id) === String(memberId));
    const memberName = member?.name || member?.email || "this member";
    if (!window.confirm(`Remove ${memberName} from this project?`)) {
      return;
    }

    removeButton.disabled = true;
    try {
      const result = await api.request(
        `/projects/${encodeURIComponent(projectId)}/members/${encodeURIComponent(memberId)}`,
        { method: "DELETE" }
      );

      if (!result?.project?._id) {
        throw new Error("The server returned an unexpected project response.");
      }

      project = result.project;
      renderTeam();
      fillAssigneeOptions();
      api.showToast("Teammate removed from the project.");
    } catch (error) {
      removeButton.disabled = false;
      api.showToast(error.message, true);
    }
  });

  document.querySelectorAll("[data-close-dialog]").forEach((button) => {
    button.addEventListener("click", () => {
      document.querySelectorAll("dialog[open]").forEach((dialog) => dialog.close());
    });
  });

  taskDialog.addEventListener("click", (event) => {
    if (event.target === taskDialog) {
      taskDialog.close();
    }
  });

  commentsDialog.addEventListener("click", (event) => {
    if (event.target === commentsDialog) {
      commentsDialog.close();
    }
  });

  taskForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    taskError.textContent = "";

    const taskId = document.getElementById("task-id").value;
    const editing = Boolean(taskId);
    const dueDateValue = document.getElementById("task-due-date").value;
    const body = {
      title: document.getElementById("task-title").value.trim(),
      description: document.getElementById("task-description").value.trim(),
      assignedTo: document.getElementById("task-assignee").value || null,
      dueDate: dueDateValue ? new Date(`${dueDateValue}T00:00:00.000Z`).toISOString() : null
    };

    taskSubmit.disabled = true;
    taskSubmit.textContent = editing ? "Saving…" : "Adding…";

    try {
      await api.request(
        editing ? `/tasks/${encodeURIComponent(taskId)}` : `/projects/${encodeURIComponent(projectId)}/tasks`,
        { method: editing ? "PUT" : "POST", body: JSON.stringify(body) }
      );

      taskDialog.close();
      api.showToast(editing ? "Task updated." : "Task added.");
      await loadTasks();
    } catch (error) {
      taskError.textContent = error.message;
    } finally {
      taskSubmit.disabled = false;
      taskSubmit.textContent = editing ? "Save changes" : "Add task";
    }
  });

  commentForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    commentError.textContent = "";
    commentSubmit.disabled = true;
    commentSubmit.textContent = "Posting…";

    try {
      await api.request(`/tasks/${encodeURIComponent(activeCommentTaskId)}/comments`, {
        method: "POST",
        body: JSON.stringify({ text: document.getElementById("comment-text").value.trim() })
      });
      commentForm.reset();
      api.showToast("Comment posted.");
      await loadComments();
    } catch (error) {
      commentError.textContent = error.message;
    } finally {
      commentSubmit.disabled = false;
      commentSubmit.textContent = "Post comment";
    }
  });

  document.getElementById("kanban-board").addEventListener("click", (event) => {
    void handleTaskAction(event);
  });

  document.getElementById("kanban-board").addEventListener("change", (event) => {
    const select = event.target.closest("[data-task-status]");
    if (select) {
      void postTaskStatus(select.dataset.taskStatus, select.value);
    }
  });

  document.getElementById("kanban-board").addEventListener("dragstart", (event) => {
    const card = event.target.closest(".task-card");
    if (!card || !event.dataTransfer) {
      return;
    }

    card.classList.add("is-dragging");
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("text/plain", card.dataset.taskId);
  });

  document.getElementById("kanban-board").addEventListener("dragend", (event) => {
    event.target.closest(".task-card")?.classList.remove("is-dragging");
    document.querySelectorAll(".kanban-column.is-over").forEach((column) => column.classList.remove("is-over"));
  });

  document.querySelectorAll(".kanban-column").forEach((column) => {
    column.addEventListener("dragover", (event) => {
      event.preventDefault();
      column.classList.add("is-over");
      if (event.dataTransfer) {
        event.dataTransfer.dropEffect = "move";
      }
    });

    column.addEventListener("dragleave", (event) => {
      if (!column.contains(event.relatedTarget)) {
        column.classList.remove("is-over");
      }
    });

    column.addEventListener("drop", (event) => {
      event.preventDefault();
      column.classList.remove("is-over");
      const taskId = event.dataTransfer?.getData("text/plain");
      const targetStatus = column.dataset.status;
      if (taskId && targetStatus) {
        void postTaskStatus(taskId, targetStatus);
      }
    });
  });

  setProfile();

  if (!projectId || !/^[a-f\d]{24}$/i.test(projectId)) {
    showLoadError("This project link is missing a valid project ID. Return to the dashboard and open a project.");
  } else {
    loadProject()
      .then(loadTasks)
      .catch((error) => showLoadError(error.message));
  }
})();
