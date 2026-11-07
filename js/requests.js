import { supabase } from "./supabase.js";

const requestForm = document.getElementById("requestForm");
const message = document.getElementById("message");

requestForm.addEventListener("submit", async function (event) {
    event.preventDefault();

    const title = document.getElementById("title").value.trim();
    const equipmentType = document.getElementById("equipmentType").value;
    const inventoryNumber = document.getElementById("inventoryNumber").value.trim();
    const location = document.getElementById("location").value.trim();
    const description = document.getElementById("description").value.trim();

    message.textContent = "Відправлення заявки...";

    const { data: { user }, error: userError } =
        await supabase.auth.getUser();

    if (userError || !user) {
        message.textContent = "Спочатку увійдіть у систему.";
        return;
    }

    const { error } = await supabase
        .from("repair_requests")
        .insert({
            user_id: user.id,
            title: title,
            equipment_type: equipmentType,
            inventory_number: inventoryNumber,
            location: location,
            description: description
        });

    if (error) {
        message.textContent = "Помилка: " + error.message;
        return;
    }

    message.textContent = "Заявку успішно створено!";
    requestForm.reset();
});
