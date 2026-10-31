
import { supabase } from "./supabase.js";

const logoutButton = document.getElementById("logoutButton");
const requestsList = document.getElementById("requestsList");
const searchInput = document.getElementById("searchInput");
const statusFilter = document.getElementById("statusFilter");

// Элементи профілю
const profileForm = document.getElementById("profileForm");
const profileName = document.getElementById("profileName");
const profileEmail = document.getElementById("profileEmail");
const profilePhone = document.getElementById("profilePhone");
const profileMessage = document.getElementById("profileMessage");
const saveProfileButton = document.getElementById("saveProfileButton");

let allRequests = [];
let currentUserId = null;

const statuses = {
    new: "Нова",
    in_progress: "У роботі",
    waiting: "Очікує",
    completed: "Завершена",
    rejected: "Відхилена"
};

const priorities = {
    low: "Низький",
    medium: "Середній",
    high: "Високий",
    critical: "Критичний"
};

const { data, error } = await supabase.auth.getUser();

if (error || !data.user) {
    window.location.href = "index.html";
} else {
    currentUserId = data.user.id;

    // Отримуємо роль користувача
    const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", currentUserId)
        .single();

    if (!profileError && profile) {
        if (profile.role === "manager") {
            document.getElementById("managerLink").hidden = false;
        }

        if (profile.role === "admin") {
            document.getElementById("adminLink").hidden = false;
        }

        // Заповнюємо поля профілю
        profileName.value = profile.full_name || "";
        profileEmail.value = profile.email || data.user.email || "";
        profilePhone.value = profile.phone || "";
    } else {
        profileMessage.textContent =
            "Не вдалося завантажити профіль.";
    }

    await loadRequests(currentUserId);
}

profileForm.addEventListener("submit", async function (event) {
    event.preventDefault();

    const fullName = profileName.value.trim();
    const phone = profilePhone.value.trim();

    if (!fullName) {
        profileMessage.textContent = "Введіть ім'я та прізвище.";
        return;
    }

    saveProfileButton.disabled = true;
    saveProfileButton.textContent = "Збереження...";
    profileMessage.textContent = "";

    const { error } = await supabase
        .from("profiles")
        .update({
            full_name: fullName,
            phone: phone
        })
        .eq("id", currentUserId);

    if (error) {
        profileMessage.textContent =
            "Помилка збереження: " + error.message;

        saveProfileButton.disabled = false;
        saveProfileButton.textContent = "Зберегти зміни";
        return;
    }

    profileMessage.textContent = "Дані успішно збережено!";

    saveProfileButton.disabled = false;
    saveProfileButton.textContent = "Зберегти зміни";
});

// Вихід з акаунта
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

// Завантажуємо заявки користувача
async function loadRequests(userId) {
    requestsList.textContent = "Завантаження заявок...";

    const { data: requests, error } = await supabase
        .from("repair_requests")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

    if (error) {
        requestsList.textContent =
            "Помилка завантаження: " + error.message;
        return;
    }

    allRequests = requests || [];
    renderRequests();
}

function renderRequests() {
    const searchText = searchInput.value.trim().toLowerCase();
    const selectedStatus = statusFilter.value;

    const filteredRequests = allRequests.filter(function (request) {
        const matchesTitle = (request.title || "")
            .toLowerCase()
            .includes(searchText);

        const matchesStatus =
            selectedStatus === "" ||
            request.status === selectedStatus;

        return matchesTitle && matchesStatus;
    });

    requestsList.replaceChildren();

    if (filteredRequests.length === 0) {
        requestsList.textContent = allRequests.length === 0
            ? "У вас поки немає заявок."
            : "Заявок за вашим запитом не знайдено.";
        return;
    }

    filteredRequests.forEach(function (request) {
        const card = document.createElement("article");
        card.className = "request-card";

        const title = document.createElement("h3");
        title.textContent = request.title;

        const id = document.createElement("p");
        id.textContent = "Номер заявки: " + request.id;

        const equipment = document.createElement("p");
        equipment.textContent =
            "Обладнання: " + (request.equipment_type || "Не вказано");

        const location = document.createElement("p");
        location.textContent =
            "Місце: " + (request.location || "Не вказано");

        const date = document.createElement("p");
        date.textContent = "Дата: " + (
            request.created_at
                ? new Date(request.created_at).toLocaleDateString("uk-UA")
                : "Не вказано"
        );

        const status = document.createElement("p");
        status.textContent = "Статус: " +
            (statuses[request.status] || request.status || "Не вказано");

        const priority = document.createElement("p");
        priority.textContent = "Пріоритет: " +
            (priorities[request.priority] || request.priority || "Не вказано");

        const description = document.createElement("p");
        description.textContent =
            "Опис: " + (request.description || "Не вказано");

        const adminComment = document.createElement("p");
        adminComment.textContent =
            "Коментар адміністратора: " +
            (request.admin_comment || "Поки немає");

        const resolution = document.createElement("p");
        resolution.textContent =
            "Рішення проблеми: " +
            (request.resolution || "Поки не вирішено");

        card.append(
            title,
            id,
            equipment,
            location,
            date,
            status,
            priority,
            description,
            adminComment,
            resolution
        );

        requestsList.appendChild(card);
    });
}
