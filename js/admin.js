import { supabase } from "./supabase.js";

const requestsList = document.getElementById("requestsList");
const logoutButton = document.getElementById("logoutButton");

const searchInput = document.getElementById("searchInput");
const statusFilter = document.getElementById("statusFilter");
const priorityFilter = document.getElementById("priorityFilter");

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

// Перевіряємо авторизацію
const { data, error } = await supabase.auth.getUser();

if (error || !data.user) {
    window.location.href = "index.html";
} else {
    const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", data.user.id)
        .single();

    if (profileError || !profile || profile.role !== "admin") {
        alert("У вас немає доступу до панелі адміністратора.");
        window.location.href = "dashboard.html";
    } else {
        await loadAllRequests();
    }
}

// Вихід з акаунта
logoutButton.addEventListener("click", async function () {
    const { error } = await supabase.auth.signOut();

    if (error) {
        alert("Помилка виходу: " + error.message);
        return;
    }

    window.location.href = "index.html";
});

// Події пошуку та фільтрів
searchInput.addEventListener("input", renderRequests);
statusFilter.addEventListener("change", renderRequests);
priorityFilter.addEventListener("change", renderRequests);

// Завантаження всіх заявок
async function loadAllRequests() {
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

    renderRequests();
}

// Пошук та фільтрація
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

    // Створюємо картки заявок
    filteredRequests.forEach(function (request) {
        const card = document.createElement("article");
        card.className = "request-card";

        const title = document.createElement("h3");
        title.textContent = request.title;

        const requestId = document.createElement("p");
        requestId.textContent = "ID заявки: " + request.id;

        const userId = document.createElement("p");
        userId.textContent = "ID користувача: " + request.user_id;

        const equipment = document.createElement("p");
        equipment.textContent =
            "Обладнання: " + (request.equipment_type || "Не вказано");

        const date = document.createElement("p");
        date.textContent = "Дата: " +
            new Date(request.created_at).toLocaleDateString("uk-UA");

        const description = document.createElement("p");
        description.textContent =
            "Опис проблеми: " + (request.description || "Не вказано");

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

        // Вибір пріоритету
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

        // Коментар адміністратора
        const commentLabel = document.createElement("label");
        commentLabel.textContent = "Коментар адміністратора:";

        const commentInput = document.createElement("textarea");
        commentInput.placeholder =
            "Наприклад, заявку передано спеціалісту";
        commentInput.value = request.admin_comment || "";
        commentInput.rows = 3;

        // Рішення проблеми
        const resolutionLabel = document.createElement("label");
        resolutionLabel.textContent = "Рішення проблеми:";

        const resolutionInput = document.createElement("textarea");
        resolutionInput.placeholder =
            "Опишіть, як було вирішено проблему";
        resolutionInput.value = request.resolution || "";
        resolutionInput.rows = 3;

        // Кнопка збереження
        const saveButton = document.createElement("button");
        saveButton.textContent = "Зберегти зміни";
        saveButton.type = "button";

        saveButton.addEventListener("click", async function () {
            saveButton.disabled = true;
            saveButton.textContent = "Збереження...";

            const updatedData = {
                status: statusSelect.value,
                priority: prioritySelect.value,
                admin_comment: commentInput.value.trim() || null,
                resolution: resolutionInput.value.trim() || null,
                updated_at: new Date().toISOString()
            };

            const { error } = await supabase
                .from("repair_requests")
                .update(updatedData)
                .eq("id", request.id);

            if (error) {
                alert("Помилка збереження: " + error.message);
                saveButton.disabled = false;
                saveButton.textContent = "Зберегти зміни";
                return;
            }

            // Оновлюємо локальні дані після збереження
            Object.assign(request, updatedData);

            saveButton.textContent = "Збережено!";
            saveButton.disabled = false;
        });

        card.append(
            title,
            requestId,
            userId,
            equipment,
            date,
            description,
            statusLabel,
            statusSelect,
            priorityLabel,
            prioritySelect,
            commentLabel,
            commentInput,
            resolutionLabel,
            resolutionInput,
            saveButton
        );

        requestsList.appendChild(card);
    });
}