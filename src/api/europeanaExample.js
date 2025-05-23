const searchEuropeanaRecords = async () => {
  const apiKey = document.getElementById("apiKey").value;
  const searchQuery = document.getElementById("searchQuery").value;

  // this is the API URL for searching Europeana records
  const url = new URL("https://api.europeana.eu/record/search.json");
  url.search = new URLSearchParams({
    // this is your API key
    wskey: apiKey,
    // this is what you are looking for
    query: searchQuery,
    // let's make sure we always get previews
    thumbnail: "true",
    // this is the maximum number of results
    rows: 5,
    // randomise the results!
    sort: "random",
    // we don't want much information here, so let's keep it minimal
    profile: "minimal",
  }).toString();

  const response = await fetch(url);
  const json = await response.json();
  return json;
};

const showResults = (searchResults) => {
  const resultsCountElement = document.getElementById("resultsCount");
  resultsCountElement.textContent = searchResults.totalResults;

  const previewsContainer = document.getElementById("previewsContainer");
  previewsContainer.innerHTML = "";
  for (const item of searchResults.items || []) {
    const cardElement = document.createElement("div");
    cardElement.classList.add("card", "m-3");
    const imgElement = document.createElement("img");
    imgElement.setAttribute("src", item.edmPreview);
    imgElement.setAttribute("alt", item.title?.[0]);
    imgElement.classList.add("card-img-top");
    cardElement.appendChild(imgElement);
    const cardBodyElement = document.createElement("div");
    cardBodyElement.classList.add("card-body");
    const cardTitleElement = document.createElement("strong");
    cardTitleElement.classList.add("card-title");
    cardTitleElement.textContent = item.title?.[0];
    cardBodyElement.appendChild(cardTitleElement);
    cardElement.appendChild(cardBodyElement);
    previewsContainer.appendChild(cardElement);
  }

  const resultsContainer = document.getElementById("resultsContainer");
  resultsContainer.classList.remove("invisible");
};

const handleSubmitSearch = async (event) => {
  event.preventDefault();
  const searchResults = await searchEuropeanaRecords();
  showResults(searchResults);
};
document
  .getElementById("search")
  .addEventListener("submit", handleSubmitSearch);
