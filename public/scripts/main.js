const sectionTitle = document.querySelectorAll(".sectionTitle");
const menu = document.querySelector("#menu");
const showMenu = document.querySelector("#showMenu");

async function deleteUser(id) {
  loading.classList.remove("opacity-0");
  loading.classList.remove("pointer-events-none");
  try {
    let res = await (
      await fetch("/delete", {
        method: "DELETE",
        headers: { "Content-type": "application/json" },
        body: JSON.stringify({
          id: id,
          nationalId: document.querySelector('[name="nationalId"]').value,
        }),
      })
    ).json();
    if (res.status) {
      Swal.fire({
        icon: "success",
        text: "کاربر حذف شد",
        confirmButtonText: "تایید",
      }).then(() => {
        location = "/search";
      });
    } else
      Swal.fire({
        icon: "error",
        text: res.message,
        confirmButtonText: "تایید",
      });
  } catch (e) {
    Swal.fire({
      icon: "error",
      text: "مشکل در سیستم.",
      confirmButtonText: "تایید",
    });
    console.log(e);
  }
  loading.classList.add("opacity-0");
  loading.classList.add("pointer-events-none");
}
function showOther(select, condition) {
  if (condition) {
  select.nextElementSibling.type = "text";
  } else {
    select.nextElementSibling.type = "hidden";
  }
}

const isValidJalaliDate = (dateString) => {
  const regex = /^\d{4}\/\d{2}\/\d{2}$/;
  if (!regex.test(dateString)) return false;

  const date = moment(dateString, "jYYYY/jMM/jDD", true);
  if (!date.isValid()) return false;

  const [year, month, day] = dateString.split("/").map(Number);

  if (month < 1 || month > 12) return false;

  const daysInMonth = moment.jDaysInMonth(year, month);
  if (day < 1 || day > daysInMonth) return false;

  return true;
};

Array.from(sectionTitle).forEach((item) => {
  item.nextElementSibling
    .querySelectorAll(
      "input:not([type='hidden']),select:not([type='hidden']),textarea:not([type='hidden'])"
    )
    .forEach((input) => {
      input.addEventListener("focus", () => {
        if (item.parentElement.children[1].style.height) {
          item.parentElement.children[1].style.height = "";
          item.style.background = "#2f569d";
          item.style.color = "#fff";
          input.scrollIntoView({ behavior: true });
        }
      });
    });
  item.addEventListener("click", () => {
    if (item.parentElement.children[1].style.height) {
      item.parentElement.children[1].style.height = "";
      item.style.background = "#2f569d";
      item.style.color = "#fff";
    } else {
      item.parentElement.children[1].style.height = "calc-size(auto,0px)";
      item.style.background = "#000";
      item.style.color = "#fff";
    }
  });
});
if (showMenu) {
  showMenu.addEventListener("click", () => {
    if (menu.style.maxHeight == "0px") {
      menu.style = `max-height: 200px;width: 200px;`;
      menu.classList.remove("pointer-events-none");
      menu.classList.remove("opacity-0");
      menu.classList.remove("overflow-hidden");
      menu.classList.add("overflow-y-auto");
    } else {
      menu.style = `max-height: 0;width: 200px;`;
      menu.classList.add("pointer-events-none");
      menu.classList.add("overflow-hidden");
      menu.classList.add("opacity-0");
      menu.classList.remove("overflow-y-auto");
    }
  });
}
window.onclick = (e) => {
  if (showMenu && !e.target.closest("#showMenu")) {
    if (menu.style.maxHeight != "0px") {
      menu.style = `max-height: 0;width: 200px;`;
      menu.classList.add("pointer-events-none");
      menu.classList.add("overflow-hidden");
      menu.classList.add("opacity-0");
      menu.classList.remove("overflow-y-auto");
    }
  }
};
