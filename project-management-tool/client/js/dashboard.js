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

  const projectGrid = document.getElementById("project-grid");
  const projectDialog = document.getElementById("project-dialog");
  const projectForm = document.getElementById("project-form");
  const formError = document.getElementById("project-form-error");
  const submitButton = document.getElementById("project-submit-button");
  const projects = new Map();

  const isOwner = (project) => {
    const ownerId = typeof project.owner === "object" ? project.owner?._id : project.owner;
    return String(ownerId) === String(user.id);
  };

  const fillProfile = () => {
    const name = user.name || "TaskFlow member";
    document.getElementById("profile-name").textContent = name;
    document.getElementById("profile-email").textContent = user.email || "";
    document.getElementById("profile-avatar").textContent = api.getInitials(name);
    document.getElementById("welcome-title").textContent = `Good work starts with a plan, ${name.split(/\s+/)[0]}.`;
    document.getElementById("today-label").textContent = new Intl.DateTimeFormat(undefined, {
      weekday: "long",
      month: "long",
      day: "numeric"
    }).format(new Date());
  };

  const showEmptyProjects = () => {
    projectGrid.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon" aria-hidden="true">✳</div>
        <h3>Your first project starts here</h3>
        <p>Create a project to bring tasks and progress together.</p>
        <button class="button button-small" type="button" data-create-project>Create a project</button>
      </div>`;
  };

  const renderProjects = (projectSummaries) => {
    projects.clear();
    for (const { project } of projectSummaries) {
      projects.set(String(project._id), project);
    }

    if (projectSummaries.length === 0) {
      showEmptyProjects();
      return;
    }

    projectGrid.innerHTML = projectSummaries.map(({ project, tasks }) => {
      const taskCount = tasks.length;
      const completedCount = tasks.filter((task) => task.status === "done").length;
      const progress = taskCount === 0 ? 0 : Math.round((completedCount / taskCount) * 100);
      const projectId = api.escapeHtml(project._id);
      const safeName = api.escapeHtml(project.name);
      const safeDescription = api.escapeHtml(project.description || "No description yet.");
      const ownerActions = isOwner(project)
        ? `<div class="project-actions">
             <button class="text-button" type="button" data-project-action="edit" data-project-id="${projectId}" aria-label="Edit ${safeName}">Edit</button>
             <button class="text-button is-danger" type="button" data-project-action="delete" data-project-id="${projectId}" aria-label="Delete ${safeName}">Delete</button>
           </div>`
        : `<span class="owner-badge">Shared</span>`;

      return `
        <article class="project-card">
          <div class="project-card-top">
            <span class="project-symbol" aria-hidden="true">▦</span>
            ${ownerActions}
          </div>
          <h3><a href="project.html?id=${encodeURIComponent(project._id)}">${safeName}</a></h3>
          <p class="project-description">${safeDescription}</p>
          <div class="progress-label"><span>Progress</span><span>${progress}%</span></div>
          <div class="progress-track" role="progressbar" aria-label="${safeName} progress" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${progress}">
            <div class="progress-fill" style="width: ${progress}%"></div>
          </div>
          <div class="project-card-bottom">
            <span>${taskCount} ${taskCount === 1 ? "task" : "tasks"} · ${completedCount} done</span>
            <a class="text-button" href="project.html?id=${encodeURIComponent(project._id)}" aria-label="Open ${safeName}">Open project →</a>
          </div>
        </article>`;
    }).join("");
  };

  const updateStats = (projectSummaries) => {
    const allTasks = projectSummaries.flatMap(({ tasks }) => tasks);
    const doneCount = allTasks.filter((task) => task.status === "done").length;
    const openCount = allTasks.filter((task) => task.status !== "done").length;

    document.getElementById("active-project-count").textContent = String(projectSummaries.length);
    document.getElementById("open-task-count").textContent = String(openCount);
    document.getElementById("done-task-count").textContent = String(doneCount);
  };

  const loadProjects = async () => {
    const errorElement = document.getElementById("page-error");
    errorElement.hidden = true;

    try {
      const result = await api.request("/projects");
      if (!Array.isArray(result?.projects)) {
        throw new Error("The server returned an unexpected projects response.");
      }

      const projectSummaries = await Promise.all(
        result.projects.map(async (project) => {
          if (!project?._id) {
            throw new Error("The server returned a project without an ID.");
          }

          const taskResult = await api.request(`/projects/${encodeURIComponent(project._id)}/tasks`);
          if (!Array.isArray(taskResult?.tasks)) {
            throw new Error(`The server returned an unexpected task response for "${project.name}".`);
          }

          return { project, tasks: taskResult.tasks };
        })
      );

      renderProjects(projectSummaries);
      updateStats(projectSummaries);
    } catch (error) {
      api.showPageError(error.message);
      projectGrid.innerHTML = "";
      document.getElementById("active-project-count").textContent = "—";
      document.getElementById("open-task-count").textContent = "—";
      document.getElementById("done-task-count").textContent = "—";
    }
  };

  const openProjectForm = (project = null) => {
    projectForm.reset();
    formError.textContent = "";
    const editing = Boolean(project);
    document.getElementById("project-dialog-title").textContent = editing ? "Edit project" : "Create a project";
    document.getElementById("project-id").value = project?._id || "";
    document.getElementById("project-name").value = project?.name || "";
    document.getElementById("project-description").value = project?.description || "";
    submitButton.textContent = editing ? "Save changes" : "Create project";
    projectDialog.showModal();
    document.getElementById("project-name").focus();
  };

  const closeDialogs = () => {
    document.querySelectorAll("dialog[open]").forEach((dialog) => dialog.close());
  };

  const onProjectAction = async (event) => {
    const actionButton = event.target.closest("[data-project-action]");
    if (!actionButton) {
      return;
    }

    const project = projects.get(actionButton.dataset.projectId);
    if (!project || !isOwner(project)) {
      api.showToast("Only the project owner can manage project settings.", true);
      return;
    }

    if (actionButton.dataset.projectAction === "edit") {
      openProjectForm(project);
      return;
    }

    if (actionButton.dataset.projectAction === "delete") {
      const confirmed = window.confirm(`Delete "${project.name}" and all its tasks and comments? This cannot be undone.`);
      if (!confirmed) {
        return;
      }

      actionButton.disabled = true;
      try {
        await api.request(`/projects/${encodeURIComponent(project._id)}`, { method: "DELETE" });
        api.showToast("Project deleted.");
        await loadProjects();
      } catch (error) {
        actionButton.disabled = false;
        api.showToast(error.message, true);
      }
    }
  };

  document.getElementById("new-project-button").addEventListener("click", () => openProjectForm());
  document.getElementById("welcome-create-button").addEventListener("click", () => openProjectForm());
  document.getElementById("logout-button").addEventListener("click", () => {
    api.clearSession();
    window.location.assign("login.html");
  });

  projectGrid.addEventListener("click", (event) => {
    const createButton = event.target.closest("[data-create-project]");
    if (createButton) {
      openProjectForm();
      return;
    }

    void onProjectAction(event);
  });

  document.querySelectorAll("[data-close-dialog]").forEach((button) => {
    button.addEventListener("click", closeDialogs);
  });

  projectDialog.addEventListener("click", (event) => {
    if (event.target === projectDialog) {
      projectDialog.close();
    }
  });

  projectForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    formError.textContent = "";

    const projectId = document.getElementById("project-id").value;
    const isEditing = Boolean(projectId);
    const body = {
      name: document.getElementById("project-name").value.trim(),
      description: document.getElementById("project-description").value.trim()
    };

    submitButton.disabled = true;
    submitButton.textContent = isEditing ? "Saving…" : "Creating…";

    try {
      await api.request(isEditing ? `/projects/${encodeURIComponent(projectId)}` : "/projects", {
        method: isEditing ? "PUT" : "POST",
        body: JSON.stringify(body)
      });

      projectDialog.close();
      api.showToast(isEditing ? "Project updated." : "Project created.");
      await loadProjects();
    } catch (error) {
      formError.textContent = error.message;
    } finally {
      submitButton.disabled = false;
      submitButton.textContent = isEditing ? "Save changes" : "Create project";
    }
  });

  fillProfile();
  document.getElementById("logout-button").addEventListener("keydown", (event) => {
    if (event.key === "Enter" || event.key === " ") {
      api.clearSession();
      window.location.assign("login.html");
    }
  });
  void loadProjects();
})();
