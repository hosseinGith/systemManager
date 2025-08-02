const sectionTitle = document.querySelectorAll(".sectionTitle");
const menu = document.querySelector("#menu");
const showMenu = document.querySelector("#showMenu");
let booksArray = [];
let member_image_url;
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
        customClass: {
          confirmButton: "button",
        },
      }).then(() => {
        location = "/search";
      });
    } else
      Swal.fire({
        icon: "error",
        text: res.message,
        confirmButtonText: "تایید",
        customClass: {
          confirmButton: "button",
        },
      });
  } catch (e) {
    Swal.fire({
      icon: "error",
      text: "مشکل در سیستم.",
      confirmButtonText: "تایید",
      customClass: {
        confirmButton: "button",
      },
    });
    console.error(e);
  }
  loading.classList.add("opacity-0");
  loading.classList.add("pointer-events-none");
}
function showOther(element, condition) {
  if (condition) {
    element.type = "text";
  } else {
    element.type = "hidden";
  }
}
async function compressImage(file, quality = 0.7) {
  return await new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target.result;

      img.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = img.width;
        canvas.height = img.height;

        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

        canvas.toBlob(
          (blob) => {
            let newFile = new File([blob], file.name, {
              type: "image/jpeg",
            });
            resolve(newFile);
          },
          "image/jpeg",
          quality
        );
      };

      img.onerror = (err) => reject(err);
    };

    reader.onerror = (err) => reject(err);
    reader.readAsDataURL(file);
  });
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
      item.parentElement.children[1].style.height = "0px";
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

document.querySelectorAll(".window").forEach((item) => {
  item.onclick = function (e) {
    if (this === e.target) this.classList.remove("active");
  };
});

function openCloseLoader(type) {
  if (!document.querySelector('.loading')) return;
  switch (type) {
    case "open":
      document.querySelector('.loading').classList.remove("opacity-0");
      document.querySelector('.loading').classList.remove("pointer-events-none");
      break;
    case "close":
      document.querySelector('.loading').classList.add("opacity-0");
      document.querySelector('.loading').classList.add("pointer-events-none");
      break;
  }
}

$("#userFile").change(async function () {
  let file = this.files[0];

  if (file.type.split("/")[0] === "image") file = await compressImage(file);
  else
    return Swal.fire({
      icon: "error",
      text: "فقط عکس مجاز است.",
      confirmButtonText: "تایید",
      customClass: {
        confirmButton: "button",
      },
    });
  openCloseLoader("open");

  try {
    const res = await fetch("/upload", {
      method: "POST",
      headers: {
        "Content-Type": "application/octet-stream",
        ext: file.type.split("/")[1],
      },
      body: file,
    });
    const data = await res.json();

    Swal.fire({
      icon: res.status === 200 ? "success" : "error",
      text: data.message,
      confirmButtonText: "تایید",
      customClass: {
        confirmButton: "button",
      },
    });
    if (res.status === 200) {
      $("#uploadPersonContainer").addClass("hidden");
      $("#uploadedUserImage").removeClass("hidden");
      $("#uploadedUserImage")[0].src = data.url;
      member_image_url = data.url;
      if (otherSuccessUpload) otherSuccessUpload();
    }
  } catch (e) {
    console.error(e);
    Swal.fire({
      icon: "error",
      text: "مشکل در اینترنت.",
      confirmButtonText: "تایید",
      customClass: {
        confirmButton: "button",
      },
    });
  }

  openCloseLoader("close");
  this.value = "";
});
async function changeeducationalBase(select) {
  $(".reshteParent").addClass("hidden");
  $(".reshteUserInfo").addClass("hidden");
  $(".reshteUserInfoText").addClass("hidden");
  if ($(".educationalBase").val() === "")
    $(".reshteUserInfoText").addClass("hidden");
  try {
    booksArray = await (await fetch("/books.json")).json();
  } catch (e) {}
  if (Object.keys(booksArray).indexOf(select.value) + 1 > 9) {
    $(".reshteUserInfo").removeClass("hidden");
    $(".reshteUserInfo").attr("required", "");
    $(".reshteParent").removeClass("hidden");
    $("[name=reshteUserInfo]").empty();
    $("[name=reshteUserInfo]").append(
      $(`<option value="">انتخاب کنید</option>`)
    );
    Object.keys(booksArray[select.value]).forEach((item, index) => {
      $("[name=reshteUserInfo]").append(
        $(`<option value="${item}">${item}</option>`)
      );
    });
  } else {
    $(".reshteUserInfo").removeAttr("required");
  }
}
