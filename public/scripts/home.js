const form = document.querySelector("form");
const loading = document.querySelector(".loading");
function formData() {
  let value = {};
  const inputs = document.querySelectorAll(
    "form input:not([type='hidden']),form select:not([type='hidden']),form textarea:not([type='hidden'])"
  );
  inputs.forEach((item) => {
    if (item.name === "birthDayDate") {
      if (!isValidJalaliDate(item.value)) {
        Swal.fire({
          icon: "error",
          text: "فرمت تاریخ اشتباه است.",
          confirmButtonText: "تایید",
          customClass: {
            confirmButton: "button",
          },
        });
        value = false;
      } else value[item.name] = item.value;
    } else if (value) value[item.name] = item.value;
  });
  return value;
}
async function submitForm(e) {
  e.preventDefault();
  openCloseLoader("open");

  let body = formData();
  if (!body) {
    openCloseLoader("close");
    return;
  }

  body["member_image_url"] = member_image_url;

  try {
    let res = await (
      await fetch("/submitNewMember", {
        method: "POST",
        headers: {
          "Content-type": "application/json",
        },
        body: JSON.stringify(body),
      })
    ).json();
    if (res.link) {
      location = res.link;
    }
    Swal.fire({
      icon: res.status ? "success" : "error",
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
  openCloseLoader("close");
}

async function getColumns() {
  openCloseLoader("open");
  try {
    let res = await (await fetch("/columns")).json();
    if (res.status) {
      res.columns.forEach((item) => {
        item.value = JSON.parse(item.value);
        if (
          columnsCont.querySelector(
            `.${item.value[2].replaceAll(" ", "")} >div`
          )
        )
          return;
        let div = `
        <div class="${item.value[2].replaceAll(
          " ",
          ""
        )} " style="gap:10px;border:2px solid #bbb;width:100%;">
          <h1 class="p-2" style="background:black;color:#fff;width:50%;margin:0 auto;border-radius: 0 0 20px 20px ;">${
            item.value[2]
          }</h1>
          <div class="grid grid-cols-1 md:grid-cols-2 p-4 gap-4"></div>
        </div>
  `;
        columnsCont.innerHTML += div;
      });
      res.columns.forEach((item, index) => {
        let li = `
            <div class="items-center flex " style="flex-wrap:wrap;">
              <span style="font-size:13px;">${item.value[0].replaceAll(
                ":",
                ""
              )}:</span>
              <input
                required
                class="w-full border-2 border-[#bbb] outline-none px-4 py-2 rounded-lg"
                type="text"
                name="${item.value[1]}"
                id=""
              />
            </div>
      `;
        columnsCont.querySelector(
          `.${item.value[2].replaceAll(" ", "")} >div`
        ).innerHTML += li;
      });
    }
  } catch (e) {
    console.error(e);
  }
  openCloseLoader("close");
}

let addUs_birthday = document.querySelector(".birthDayDate");
jalaliDatepicker.startWatch({
  dayRendering: function (dayOptions, addUs_birthday) {
    return {
      isHollyDay: dayOptions.month == 1 && dayOptions.day <= 4,
    };
  },
});

$("#goToUserEdit").change(() => {
  if ($("#goToUserEdit")[0].checked) $("#goToUserEdit").val("true");
  else $("#goToUserEdit").val("false");
});
