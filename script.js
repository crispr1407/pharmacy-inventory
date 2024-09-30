let drugsArr;
// Status messages:
const loadingMessage = document.getElementsByClassName("loader");
const noDrugsFoundMessage = `<tr>
                              <td colspan="5" class="no-data-message">
                                <img class="no-data-image" src="medical-question-mark.png" alt="?"></img>
                              <br>No drugs found!<br><br><br>
                              * Tip: Try searching for drugs by typing their scientific or generic names. *
                              </td>
                            </tr>`;
const errorMessage = `<tr><td colspan="5" class="no-data-message" style="text-align:center">Error loading data.</td></tr>`;

// Loading json file.
async function buildFromJSON() {
  loadingMessage[0].style.display = "block";
  try {
    const file = await $.getJSON("drugs.json");
    drugsArr = file.Ampoules.concat(
      file.Vials,
      file.HighAlertMedications,
      file.RefrigeratedMedications,
      file.Pills,
      file.OralPreparations,
      file.Topicals,
      file.IVFluids
    );

    loadingMessage[0].style.display = "none";

    buildTable(drugsArr);
  } catch (error) {
    console.error("Error fetching json file!", error);
    loadingMessage[0].style.display = "none";
    const table = document
      .getElementById("drug-table")
      .getElementsByTagName("tbody")[0];
    table.innerHTML = errorMessage;
  }
}
buildFromJSON();

// Depricated json fetch without async/await and error handling.
// Use when old browsers go brr...
// $.getJSON("drugs.json", function (file){
//   drugsArr = file.Ampoules.concat(file.Vials, file.HighAlertMedications, file.RefrigeratedMedications,file.Pills, file.OralPreparations, file.Topicals, file.IVFluids);          //   // console.log(drugsArr);
//   buildTable(drugsArr);
// });

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
    let statusClass =
      dataArr[i].availability === 1 ? "status-available" : "status-unavailable";
    let doseDisplayed = dataArr[i].dose === 0 ? "" : dataArr[i].dose;
    let unitDisplayed = dataArr[i].dose === 0 ? "" : dataArr[i].unit;
    let opacity = dataArr[i].availability === 0 ? 'class="unavailable"' : "";
    rows += `<tr ${opacity}>
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

// Search functionality
$("#search-input").on("keyup", function () {
  let value = $(this).val();
  let data = searchTable(value, drugsArr);
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
