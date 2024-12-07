let drugsArr;
// Status messages:
const loadingMessage = document.getElementsByClassName("loader")[0];
const noDrugsFoundMessage = `<tr>
                              <td colspan="5" class="no-data-message">
                                <img class="no-data-image" src="medical-question-mark.png" alt="?"></img>
                              <br>No drugs found!<br><br><br>
                              * Tip: Try searching for drugs by typing their scientific or generic names. *
                              </td>
                            </tr>`;
const errorMessage = `<tr><td colspan="5" class="no-data-message" style="text-align:center">Error loading data.</td></tr>`;
const table = document
  .getElementById("drug-table")
  .getElementsByTagName("tbody")[0];

// Loading json file.
async function buildFromJSON(category) {
  table.innerHTML = ""; // Resets table
  loadingMessage.style.display = "block";
  try {
    const data = await $.getJSON("drugs.json");
    if (category === "all") {
      drugsArr = data.Ampoules.concat(
        data.Vials,
        data.HighAlertMedications,
        data.RefrigeratedMedications,
        data.Pills,
        data.OralPreparations,
        data.Topicals,
        data.IVFluids
      );
    } else {
      drugsArr = data[category];
    }

    loadingMessage.style.display = "none";
    displayInfoBar(drugsArr);

    if (!$(".filter-button").length) {
      displayFilterButtons(data);
    }

    buildTable(drugsArr);
  } catch (error) {
    console.error("Error fetching json file!", error);
    loadingMessage.style.display = "none";
    table.innerHTML = errorMessage;
  }
}
buildFromJSON("all");

// Depricated json fetch without async/await and error handling.
// Use when old browsers go brr...
// $.getJSON("drugs.json", function (data){
//   drugsArr = data.Ampoules.concat(data.Vials, data.HighAlertMedications, data.RefrigeratedMedications,data.Pills, data.OralPreparations, data.Topicals, data.IVFluids);          //   // console.log(drugsArr);
//   buildTable(drugsArr);
// });

function displayInfoBar(dataArr) {
  const infoBar = $("#info-bar");
  const [availableNum, unavailableNum] = dataArr.reduce(
    ([avNum, naNum], item) => {
      if (item.availability === 1) avNum++;
      else naNum++;
      return [avNum, naNum];
    },
    [0, 0]
  ); // Cursed reduce function.

  const text = `Showing <strong>${
    dataArr.length === 0 ? "no" : dataArr.length
  }</strong> ${
    dataArr.length === 1 ? "item" : "items"
  }. <span class="available-number">(${availableNum}</span>/<span class="unavailable-number">${unavailableNum})</span>`;

  infoBar.html(text);
}

function displayFilterButtons(data) {
  // Button click event handler
  const handleFilter = (category, clickedButton) => {
    $(".filter-button").removeClass("active");
    clickedButton.addClass("active");

    // Replace placeholder text in search bar.
    const placholder = (category) => {
      const newCategory = formattedCategoryName(category).toLowerCase();
      if (newCategory === "all") return "all items";
      if (newCategory === "iv fluids") return "IV fluids";
      return newCategory;
    };
    $("#search-input").attr(
      "placeholder",
      `Search for ${placholder(category)}...`
    );
    buildFromJSON(category);
  };
  const filterContainer = $(".filter");

  // "All" button.
  const allButton = $(
    `<button class="filter-button active">All Items</button>`
  );
  allButton.on("click", () => handleFilter("all", allButton));
  filterContainer.append(allButton);

  // Category buttons.
  const formattedCategoryName = (category) => {
    if (category === "IVFluids") return "IV Fluids"; // Stupid hack
    return category.replace(/([a-z])([A-Z])/g, "$1 $2"); // Regex to add spaces between words in the json property names.
  };
  for (const category in data) {
    // Ampoules, Vials, Pills, etc..
    const button = $(
      `<button class="filter-button">${formattedCategoryName(
        category
      )}</button>`
    );
    button.on("click", () => handleFilter(category, button));
    filterContainer.append(button);
  }
}

function buildTable(dataArr) {
  const table = document
    .getElementById("drug-table")
    .getElementsByTagName("tbody")[0];

  table.innerHTML = ""; // Resets the table.

  // Displaying "No Drugs Found" message.
  if (dataArr.length === 0) {
    table.innerHTML = noDrugsFoundMessage;
    return;
  }

  let rows = "";
  for (let i = 0; i < dataArr.length; i++) {
    let drugId = dataArr[i].id;
    let statusClass =
      dataArr[i].availability === 1 ? "status-available" : "status-unavailable";
    let doseDisplayed = dataArr[i].dose === 0 ? "" : dataArr[i].dose;
    let unitDisplayed = dataArr[i].dose === 0 ? "" : dataArr[i].unit;
    let opacity = dataArr[i].availability === 0 ? " unavailable" : "";
    rows += `<tr class="drug-row${opacity}" drug-id="${drugId}">
                                  <td class="drug-name">${dataArr[i].name}
                                  <p class="trade-name">${
                                    dataArr[i].tradeName
                                  }</p>
                                  </td>
                                  <td>${dataArr[i].form}</td>
                                  <td>${doseDisplayed}${unitDisplayed}</td>
                                  <td>${dataArr[i].class}</td>
                                  <td class="${statusClass}">${
      dataArr[i].availability === 1 ? "Available" : "Unavailable"
    }</td>
                            </tr>`;
  }
  table.innerHTML = rows; // Sets the concatenated string as the inner HTML of the table.
}

function searchTable(value, dataArr) {
  let filteredData = [];

  for (let i = 0; i < dataArr.length; i++) {
    value = value.trim().toLowerCase();
    let name = dataArr[i].name.toLowerCase();
    let tradeName = dataArr[i].tradeName.toLowerCase();

    if (name.includes(value) || tradeName.includes(value)) {
      filteredData.push(dataArr[i]);
    }
  }

  return filteredData;
}

// TODO: Deal with TypeError.
// Why the fuck does this throw an error when sorting?
function buildModal(item) {
  const modalText = document.getElementsByClassName("modal-text")[0];
  const itemStatus = item.availability === 1 ? "Available" : "Unavailable";
  const routeText = item.route.join("/");
  // When item is not available display other doses.
  const otherDoseElement = (item, dataArr) => {
    if (item.availability === 1) {
      return "";
    }
    const otherDoses = dataArr.filter(
      (otherItem) =>
        otherItem.name === item.name &&
        otherItem.dose !== item.dose &&
        otherItem.form === item.form &&
        otherItem.availability === 1
      // Other item must be of the same name and form but has different dose.
    );

    if (otherDoses.length === 0) return ""; // No other doses.

    return `<div class="other-text">Other dose available: <strong>${otherDoses.map(
      (drug) => `${drug.dose}${drug.unit}`
    )}</strong></div>`;
  };

  const statusColor =
    item.availability === 1
      ? "var(--available-color)"
      : "var(--unavailable-color)";
  const backgroundColor = (fluid) => {
    const colors = {
      NS: "blue",
      GW5: "red",
      GW10: "maroon",
      GS: "orange",
      R: "teal",
      RL: "turquoise",
      HM: "black",
      DW: "aqua",
    };
    return `style="background-color:${colors[fluid]}"`;
  };

  const fluidName = (fluid) => {
    const fullNames = {
      NS: "Normal Saline 0.9%",
      GW5: "Glucose Water 5%",
      GW10: "Glucose Water 10%",
      GS: "Glucose Saline",
      R: "Ringer's",
      RL: "Lactated Ringer's",
      HM: "Hartman's",
      DW: "Distilled Water for Injection",
    };
    return `${fullNames[fluid]}`;
  };

  const itemElement = (item) => {
    const tradeNameDisplayed = item.tradeName ? `${item.tradeName}` : "";
    const doseDisplayed = item.dose != 0 ? `${item.dose}${item.unit}` : "";
    return `<strong>${item.name}</strong> ${doseDisplayed} <p class="modal-trade-name">${tradeNameDisplayed}</p>`;
  };

  const formIconElement = (item) => {
    const image = {
      ampoule: "ampoule.png",
      vial: "vial.png",
      "infusion bottle": "infusion.png",
      "nebulising solution": "mask.png",
      "nebulising suspension": "mask.png",
      "prefilled syringe": "syringe.png",
      capsule: "capsule.png",
      tablet: "pill.png",
      syrup: "syrup.png",
      elixir: "syrup.png",
      "oral suspension": "syrup.png",
      "oral drops": "syrup.png",
      powder: "syrup.png",
      "skin ointment": "cream-tube.png",
      "skin cream": "cream-tube.png",
      "skin gel": "cream-tube.png",
      "eye ointment": "cream-tube.png",
      "nasal drops": "nasal-spray.png",
      "nasal spray": "nasal-spray.png",
      suppository: "supp.png",
    };
    return `<img class="form-icon" src="./img/form/${image[item.form]}"></img>`;
  };

  const imageElement = (item) => {
    if (!item.image) {
      return "";
    }
    return `<div class="drug-image-container">
              <img class="drug-image" src="./img/${item.image[0]}" alt="${item.name} ${item.form}"></img>
              <img class="drug-image" src="./img/${item.image[1]}" alt="${item.name} ${item.form}"></img>
            </div>`;
  };

  const fluidElement = (fluids) => {
    let element = "";
    fluids.forEach((fluid) => {
      element += `<span class="fluid" ${backgroundColor(
        fluid
      )}>${fluid}</span>`;
    });
    return element;
  };

  const compElement =
    item.compatibleWith.length > 0
      ? `<p class="comp-text">Compatible with: <br> ${fluidElement(
          item.compatibleWith
        )}</p>`
      : "";

  const compWarning =
    item.compatibleWith.length === 1
      ? `<p class="comp-warning"><strong>Caution &#9888;</strong> Item is compatible with only one type of fluid.</p>`
      : "";

  const fluidInfo = (fluids) => {
    let element = "";
    fluids.forEach((fluid) => {
      element += `<strong>${fluid}</strong> &rarr; ${fluidName(fluid)}. `;
    });
    return element;
  };

  modalText.innerHTML = `
    <div>
     <p class="modal-name">${itemElement(item)}</p>
    </div>
      <div class="modal-route"><span>${formIconElement(item)}${
    item.form
  } &rarr; ${routeText}</span></div>
      <div class="modal-status" style="background-color: ${statusColor};"><span> ${itemStatus}</span></div>
      ${otherDoseElement(item, drugsArr)}
      ${imageElement(item)}
      <div>${compElement}</div>
      <div>${compWarning}</div>
      <br><br><p class="fluid-info">${fluidInfo(item.compatibleWith)}</p>
      `;
}

// Search functionality
$("#search-input").on("keyup", function () {
  let value = $(this).val();
  let data = searchTable(value, drugsArr);
  displayInfoBar(data);
  buildTable(data);
});

// Sort functionality
$("th").on("click", function () {
  let column = $(this).data("column");
  let order = $(this).data("order");
  let text = $(this).html();
  text = text.substring(0, text.length - 1);

  if (order == "desc") {
    $(this).data("order", "asc");
    drugsArr = drugsArr.sort((a, b) => (a[column] > b[column] ? 1 : -1));
    text += "&#9660";
  } else {
    $(this).data("order", "desc");
    drugsArr = drugsArr.sort((a, b) => (a[column] < b[column] ? 1 : -1));
    text += "&#9650";
  }
  $(this).html(text);
  buildTable(drugsArr);
});

// Modal functionality
$(document).on("click", "tr", function () {
  let drugId = parseInt($(this).attr("drug-id"));
  let drug = drugsArr.find((d) => d.id === drugId);
  buildModal(drug);
  $(".info-modal").css({ display: "block" });
});
// Close modal
$(document).on("click", ".close", function () {
  $(".info-modal").css({ display: "none" });
});

//Fullscreen image
$(document).on("click", ".drug-image", function () {
  let img = $(this);
  // Create overlay if it doesn't exist
  if (!$(".fullscreen-overlay").length) {
    $("body").append('<div class="fullscreen-overlay"></div>');
  }
  // Enter fullscreen
  let overlay = $(".fullscreen-overlay").addClass("active");
  let fullImg = img
    .clone()
    .removeClass("drug-image")
    .addClass("fullscreen")
    .appendTo("body");
  // Close fullscreen
  $("body").on("click", () => {
    fullImg.remove();
    overlay.removeClass("active").remove();
  });
});
