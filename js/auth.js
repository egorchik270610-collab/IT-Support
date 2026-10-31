import { supabase } from "./supabase.js";

const registerForm = document.getElementById("registerForm");
const message = document.getElementById("message");

async function redirectByRole(userId) {
    const { data: profile, error } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", userId)
        .single();

    if (error || !profile) {
        console.error("Помилка отримання профілю:", error);
        window.location.href = "dashboard.html";
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

const { data: sessionData, error: sessionError } =
    await supabase.auth.getSession();

if (sessionError) {
    console.error("Помилка перевірки сесії:", sessionError);
} else if (sessionData.session) {
    await redirectByRole(sessionData.session.user.id);
}

registerForm.addEventListener("submit", async function (event) {
    event.preventDefault();

    const fullName = document.getElementById("fullName").value.trim();
    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value;
    const confirmPassword =
        document.getElementById("confirmPassword").value;

    if (!fullName || !email || !password || !confirmPassword) {
        message.textContent = "Заповніть усі поля!";
        return;
    }

    if (password !== confirmPassword) {
        message.textContent = "Паролі не співпадають!";
        return;
    }

    message.textContent = "Реєстрація...";

    const { data, error } = await supabase.auth.signUp({
        email: email,
        password: password,
        options: {
            data: {
                full_name: fullName
            }
        }
    });

    if (error) {
        message.textContent = "Помилка: " + error.message;
        return;
    }

    if (data.user && !data.session) {
        message.textContent =
            "Акаунт створено. Перевірте пошту для підтвердження.";

        registerForm.reset();
        return;
    }

    if (data.session) {
        message.textContent = "Реєстрація пройшла успішно!";

        registerForm.reset();

        setTimeout(function () {
            redirectByRole(data.user.id);
        }, 2500);
    }
});
