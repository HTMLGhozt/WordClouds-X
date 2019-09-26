const siteButton = document.getElementById('get_site_button');
const siteInput = document.getElementById('get_site');

class WordClouds extends HTMLElement {
  constructor(text) {
    super(text);
    const shadow = this.attachShadow({ mode: 'open' });

    const wordList = document.createElement('ul');
    wordList.classList.add('word-list');
    shadow.appendChild(wordList);
  }

  connectedCallback() {
    this.wordList = this.shadowRoot.querySelector('.word-list');
  }

  addWordToCloud = (word, ammount) => {
    const li = document.createElement('li');
    li.textContent = word;
    li.style.cssText = `font-size: ${12 + (ammount * .5)}px`
    this.wordList.appendChild(li);
  }
}

siteButton.addEventListener('click', async () => {
  const { value } = siteInput;
  const site = await fetch(`/api/site/?site=${value}`)
    .then(response => response.text());

  const dom = document.createElement('div');
  dom.innerHTML = site;

  const wordsList = {};
  const queue = [dom];
  while (queue.length) {
    const item = queue.pop();
    if (item.hasChildNodes()) {
      queue.push(...item.childNodes);
    }
    if (item.innerText) {
      const words = item.innerText.split(' ');
      words.forEach(word => {
        const lowerWord = word.replace(/[^0-9a-zA-Z]/g, '').toLowerCase();
        if (!lowerWord.length) return;
        if (!wordsList[lowerWord]) {
          wordsList[lowerWord] = 0;
        }
        wordsList[lowerWord]++;
      });
    }
  }
  const WL = document.querySelector('word-clouds');
  Object.entries(wordsList).forEach(([word, ammount]) => WL.addWordToCloud(word, ammount));
});

customElements.define('word-clouds', WordClouds);

