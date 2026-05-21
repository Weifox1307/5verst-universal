import bridge from '@vkontakte/vk-bridge';

// Инициализация VK Bridge
bridge.send("VKWebAppInit");

let currentVkContext = null;
let currentPark = null;
const GAS_API_URL = "https://script.google.com/macros/s/AKfycbx1yAfyNSeqW7rqDLpzS4EQGkJRVkdx-1k0pHTM8Hgx0U-d9q8yNrYDHgMSDWdqHjvd/exec";

// 1. Извлекаем параметры запуска ВК
const searchParams = new URLSearchParams(window.location.search);
const vkGroupId = searchParams.get("vk_group_id") || searchParams.get("vk_chat_id");

async function initApp() {
  if (!vkGroupId) {
    showError("Пожалуйста, запустите приложение внутри группы или чата 5 вёрст.");
    return;
  }

  // Получаем данные текущего пользователя для записи
  currentVkContext = await bridge.send("VKWebAppGetUserInfo");

  // 2. Запрашиваем у нашего GAS-сервера, что это за парк
  const response = await fetch(GAS_API_URL, {
    method: "POST",
    body: JSON.stringify({
      action: "get_park_context",
      vk_id: vkGroupId
    })
  });
  
  const result = await response.json();
  
  if (result.status === "success") {
    currentPark = result.context;
    renderVolunteerDashboard(currentPark); // Показываем интерфейс записи для конкретного парка
  } else if (result.status === "not_found") {
    // Если парк еще не зарегистрирован в нашей БД — проверяем, админ ли вошедший
    const memberInfo = await bridge.send("VKWebAppGetGroupMembers", { group_id: vkGroupId, filter: "managers" });
    const isManager = memberInfo.items.some(m => m.id === currentVkContext.id);
    
    if (isManager) {
      renderRegistrationForm(vkGroupId); // Показываем форму первичной настройки только админу
    } else {
      showError("Этот парк еще не настроен организатором.");
    }
  }
}

initApp();
