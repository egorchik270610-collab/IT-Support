import { supabase } from "./supabase.js";

const loginForm = document.getElementById("loginForm");
const message = document.getElementById("message");

async function redirectByRole(userId) {
    const { data: profile, error } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", userId)
        .single();

    if (error || !profile) {
        console.error("Помилка отримання профілю:", error);
        message.textContent = "Не вдалося отримати дані профілю.";
        return;
    }

    if (profile.role === "admin") {
        window.location.href = "admin.html";
    } else if (profile.role === "manager") {
        window.location.href = "manager.html";
    } else {
        window.location.href = "dashboard.html";
    }
}

const { data: sessionData } = await supabase.auth.getSession();

if (sessionData.session) {
    await redirectByRole(sessionData.session.user.id);
}

loginForm.addEventListener("submit", async function (event) {
    event.preventDefault();

    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value;

    if (!email || !password) {
        message.textContent = "Заповніть усі поля!";
        return;
    }

    message.textContent = "Вхід...";

    const { data, error } = await supabase.auth.signInWithPassword({
        email: email,
        password: password
    });

    if (error) {
        message.textContent = "Помилка входу: " + error.message;
        return;
    }

    message.textContent = "Вхід успішний!";

    await redirectByRole(data.user.id);
});
