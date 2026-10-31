
import { supabase } from "./supabase.js";

const logoutButton = document.getElementById("logoutButton");
const requestsList = document.getElementById("requestsList");

const searchInput = document.getElementById("searchInput");
const statusFilter = document.getElementById("statusFilter");
const priorityFilter = document.getElementById("priorityFilter");

const totalRequests = document.getElementById("totalRequests");
const newRequests = document.getElementById("newRequests");
const inProgressRequests = document.getElementById("inProgressRequests");
const completedRequests = document.getElementById("completedRequests");

let allRequests = [];

const statuses = [
    ["new", "Нова"],
    ["in_progress", "У роботі"],
    ["waiting", "Очікує"],
    ["completed", "Завершена"],
    ["rejected", "Відхилена"]
];

const priorities = [
    ["low", "Низький"],
    ["medium", "Середній"],
    ["high", "Високий"],
    ["critical", "Критичний"]
];

const { data, error } = await supabase.auth.getUser();

if (error || !data.user) {
    window.location.href = "index.html";
} else {
    // Перевіряємо роль користувача
    const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", data.user.id)
        .single();

    if (profileError || !profile || profile.role !== "manager") {
        alert("У вас немає доступу до панелі менеджера.");
        window.location.href = "dashboard.html";
    } else {
        await loadRequests();
    }
}

logoutButton.addEventListener("click", async function () {
    const { error } = await supabase.auth.signOut();

    if (error) {
        alert("Помилка виходу: " + error.message);
        return;
    }

    window.location.href = "index.html";
});

searchInput.addEventListener("input", renderRequests);
statusFilter.addEventListener("change", renderRequests);
priorityFilter.addEventListener("change", renderRequests);

async function loadRequests() {
    requestsList.textContent = "Завантаження заявок...";

    const { data: requests, error } = await supabase
        .from("repair_requests")
        .select("*")
        .order("created_at", { ascending: false });

    if (error) {
        requestsList.textContent =
            "Помилка завантаження: " + error.message;
        return;
    }

    allRequests = requests || [];

    updateStatistics();
    renderRequests();
}

function updateStatistics() {
    totalRequests.textContent = allRequests.length;

    newRequests.textContent = allRequests.filter(
        request => request.status === "new"
    ).length;

    inProgressRequests.textContent = allRequests.filter(
        request => request.status === "in_progress"
    ).length;

    completedRequests.textContent = allRequests.filter(
        request => request.status === "completed"
    ).length;
}

function renderRequests() {
    const searchText = searchInput.value.trim().toLowerCase();
    const selectedStatus = statusFilter.value;
    const selectedPriority = priorityFilter.value;

    const filteredRequests = allRequests.filter(function (request) {
        const matchesSearch =
            (request.id || "").toLowerCase().includes(searchText) ||
            (request.user_id || "").toLowerCase().includes(searchText) ||
            (request.title || "").toLowerCase().includes(searchText);

        const matchesStatus =
            selectedStatus === "" ||
            request.status === selectedStatus;

        const matchesPriority =
            selectedPriority === "" ||
            request.priority === selectedPriority;

        return matchesSearch && matchesStatus && matchesPriority;
    });

    requestsList.replaceChildren();

    if (filteredRequests.length === 0) {
        requestsList.textContent = allRequests.length === 0
            ? "Заявок поки немає."
            : "Заявок за вашим запитом не знайдено.";
        return;
    }

    filteredRequests.forEach(function (request) {
        const card = document.createElement("article");
        card.className = "request-card";

        const title = document.createElement("h3");
        title.textContent = request.title;

        const id = document.createElement("p");
        id.textContent = "ID заявки: " + request.id;

        const userId = document.createElement("p");
        userId.textContent = "ID користувача: " + request.user_id;

        const equipment = document.createElement("p");
        equipment.textContent =
            "Обладнання: " + (request.equipment_type || "Не вказано");

        const date = document.createElement("p");
        date.textContent = "Дата: " + (
            request.created_at
                ? new Date(request.created_at).toLocaleDateString("uk-UA")
                : "Не вказано"
        );

        const description = document.createElement("p");
        description.textContent =
            "Опис: " + (request.description || "Не вказано");

        // Вибір статусу
        const statusLabel = document.createElement("label");
        statusLabel.textContent = "Статус:";

        const statusSelect = document.createElement("select");

        statuses.forEach(function (option) {
            const item = document.createElement("option");
            item.value = option[0];
            item.textContent = option[1];
            statusSelect.appendChild(item);
        });

        statusSelect.value = request.status || "new";

        const priorityLabel = document.createElement("label");
        priorityLabel.textContent = "Пріоритет:";

        const prioritySelect = document.createElement("select");

        priorities.forEach(function (option) {
            const item = document.createElement("option");
            item.value = option[0];
            item.textContent = option[1];
            prioritySelect.appendChild(item);
        });

        prioritySelect.value = request.priority || "low";

        const saveButton = document.createElement("button");
        saveButton.type = "button";
        saveButton.textContent = "Зберегти зміни";

        saveButton.addEventListener("click", async function () {
            saveButton.disabled = true;
            saveButton.textContent = "Збереження...";

            const { error } = await supabase
                .from("repair_requests")
                .update({
                    status: statusSelect.value,
                    priority: prioritySelect.value,
                    updated_at: new Date().toISOString()
                })
                .eq("id", request.id);

            if (error) {
                alert("Помилка збереження: " + error.message);
                saveButton.disabled = false;
                saveButton.textContent = "Зберегти зміни";
                return;
            }

            request.status = statusSelect.value;
            request.priority = prioritySelect.value;

            updateStatistics();

            saveButton.textContent = "Збережено!";

            renderRequests();
        });

        card.append(
            title,
            id,
            userId,
            equipment,
            date,
            description,
            statusLabel,
            statusSelect,
            priorityLabel,
            prioritySelect,
            saveButton
        );

        requestsList.appendChild(card);
    });
}
