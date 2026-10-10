
const searchForm = document.getElementById("searchForm");
const wordInput = document.getElementById("wordInput");
const searchButton = document.getElementById("searchButton");
const result = document.getElementById("result");
const status = document.getElementById("status");

const API_URLS = [
    word =>
        `https://freedictionaryapi.com/api/v1/entries/en/${encodeURIComponent(word)}`,

    word =>
        `https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(word)}`
];

searchForm.addEventListener("submit", function (event) {
    event.preventDefault();

    const word = wordInput.value.trim();

    if (word) {
        searchWord(word);
    }
});

async function getDictionaryData(url) {
    const response = await fetch(url, {
    signal: AbortSignal.timeout(5000)
});

    if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
    }

    const data = await response.json();

    // FreeDictionaryAPI.com response format
    if (data.entries && data.entries.length > 0) {
        const definitions = [];

        data.entries.forEach(entry => {
            (entry.senses || []).forEach(sense => {
                if (sense.definition) {
                    definitions.push({
                        partOfSpeech: entry.partOfSpeech || "Meaning",
                        definition: sense.definition,
                        examples: sense.examples || [],
                        synonyms: sense.synonyms || []
                    });
                }
            });
        });

        if (definitions.length > 0) {
            return {
                word: data.word,
                phonetic: "",
                definitions
            };
        }
    }

    // Original Free Dictionary API response format
    if (Array.isArray(data) && data.length > 0) {
        const definitions = [];

        data.forEach(entry => {
            (entry.meanings || []).forEach(meaning => {
                (meaning.definitions || []).forEach(item => {
                    definitions.push({
                        partOfSpeech: meaning.partOfSpeech || "Meaning",
                        definition: item.definition,
                        examples: item.example ? [item.example] : [],
                        synonyms: item.synonyms || []
                    });
                });
            });
        });

        if (definitions.length > 0) {
            return {
                word: data[0].word,
                phonetic: data[0].phonetic || "",
                definitions
            };
        }
    }

    throw new Error("No definitions available from this source.");
}

async function searchWord(word) {
    status.textContent = "Searching dictionaries...";
    result.replaceChildren();
    searchButton.disabled = true;

    let dictionaryData = null;

    for (const makeUrl of API_URLS) {
        try {
            dictionaryData = await getDictionaryData(makeUrl(word));
            break;
        } catch (error) {
            // Try the next API automatically
        }
    }

    searchButton.disabled = false;

    if (dictionaryData) {
        displayWord(dictionaryData);
        status.textContent = "Definition found successfully!";
    } else {
        const message = document.createElement("p");
        message.className = "error";
        message.textContent =
            "We couldn't retrieve this word. Both dictionary services may be unavailable, or the word may not be in their databases.";

        result.replaceChildren(message);
        status.textContent = "Search unsuccessful.";
    }
}

function displayWord(data) {
    result.replaceChildren();

    const title = document.createElement("h2");
    title.className = "word-title";
    title.textContent = data.word || wordInput.value.trim();
    result.appendChild(title);

    if (data.phonetic) {
        const pronunciation = document.createElement("p");
        pronunciation.className = "phonetic";
        pronunciation.textContent = "Pronunciation: " + data.phonetic;
        result.appendChild(pronunciation);
    }

    data.definitions.forEach((item, index) => {
        const section = document.createElement("div");
        section.className = "meaning";

        const partOfSpeech = document.createElement("h3");
        partOfSpeech.className = "part-of-speech";
        partOfSpeech.textContent = item.partOfSpeech;
        section.appendChild(partOfSpeech);

        const definition = document.createElement("p");
        definition.className = "definition";
        definition.textContent = `${index + 1}. ${item.definition}`;
        section.appendChild(definition);

        item.examples.forEach(exampleText => {
            const example = document.createElement("p");
            example.className = "example";
            example.textContent = `Example: "${exampleText}"`;
            section.appendChild(example);
        });

        if (item.synonyms.length > 0) {
            const synonyms = document.createElement("p");
            synonyms.className = "synonyms";
            synonyms.textContent =
                "Synonyms: " + item.synonyms.join(", ");
            section.appendChild(synonyms);
        }

        result.appendChild(section);
    });
}


