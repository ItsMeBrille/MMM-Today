Module.register("MMM-Today", {
    // Module defaults
    defaults: {
        fetchInterval: 1, // Fetch file every hour
        changeInterval: 15, // In seconds
    },

    start: function () {
        this.articles = [];
        this.currentArticleIndex = 0;
        this.loadArticle();
        this.scheduleFetch();
        this.scheduleChange();
    },

    scheduleFetch: function () {
        const self = this;
        setInterval(function () {
            self.loadArticle();
        }, this.config.fetchInterval * 60 * 60 * 1000);
    },

    scheduleChange: function () {
        const self = this;
        setInterval(function () {
            self.changeArticle();
        }, this.config.changeInterval * 1000);
    },

    loadArticle: function () {
        const today = new Date();
        const monthNames = [
            "januar", "februar", "mars", "april", "mai", "juni",
            "juli", "august", "september", "oktober", "november", "desember"
        ];
        const month = monthNames[today.getMonth()];
        const monthNumber = (today.getMonth() + 1).toString().padStart(2, '0');
        const dayNumber = today.getDate().toString().padStart(2, '0');

        const apiURL = `https://www.dagsdato.no/dagen/${monthNumber}_${month}/dagen${monthNumber}${dayNumber}.js`;

        this.config.apiURL = apiURL;
        this.loadData();
    },

    loadData: function () {
        const url = 'https://cors-anywhere.herokuapp.com/' + this.config.apiURL;
        const headers = {
            'X-Requested-With': 'XMLHttpRequest'
        };

        const self = this;
        fetch(url, { headers })
            .then(response => response.arrayBuffer())
            .then(data => {
                const decoder = new TextDecoder("iso-8859-1");
                const text = decoder.decode(data);
                self.articles = self.extractArticles(text);
                self.currentArticleIndex = 0; // Reset the article index
                self.changeArticle(); // Display the first article
            })
            .catch(error => {
                console.error("Error fetching data:", error);
            });
    },

    changeArticle: function () {
        if (this.articles.length > 0) {
          const currentArticle = this.articles[this.currentArticleIndex];
          const articleYearMatch = /(\d{4})/.exec(currentArticle); // Extract year from article content
          const articleYear = articleYearMatch ? articleYearMatch[1] : ''; // Extracted year or empty string
      
          this.articleContent = currentArticle;
          this.articleYear = articleYear; // Store extracted year
          this.updateDom();
          this.currentArticleIndex = (this.currentArticleIndex + 1) % this.articles.length;
        } else {
          this.articleContent = "Finner ingen artikler.";
          this.articleYear = '';
          this.updateDom();
        }
      },

    extractArticles: function (data) {
        const excludedKeywords = ["født"]; // List of excluded keywords
        const articles = [];
        const regex = /<SPAN CLASS="tekst7-x">(.*?)<\/SPAN>(.*?)<BR>/g;
        let match;

        const decoder = new DOMParser();
        while ((match = regex.exec(data)) !== null) {
            const articleNumber = match[1];
            const articleContent = decoder.parseFromString(match[2], 'text/html').body.textContent;

            // Check if article content contains excluded keywords
            if (!excludedKeywords.some(keyword => articleContent.includes(keyword))) {
                articles.push(`<b>${articleNumber}</b> ${articleContent}`);
            }
        }
        return articles;
    },


    getDom: function () {
        const wrapper = document.createElement("div");
      
        if (this.articles.length > 0) {
          const articleSource = document.createElement("div");
          articleSource.className = "light small dimmed";
          const url = new URL(this.config.apiURL);
          articleSource.innerText = `Fra ${url.hostname}`;
          wrapper.appendChild(articleSource);
      
          const articleTitle = document.createElement("div");
          articleTitle.className = "bright medium light";
          articleTitle.innerText = "Denne datoen, "+this.articleYear || "Dagens artikkel"; // Use the year or default text
          wrapper.appendChild(articleTitle);
      
          const articleContentElement = document.createElement("div");
          articleContentElement.className = "small light articleContent";
          articleContentElement.innerHTML = this.articleContent;
          wrapper.appendChild(articleContentElement);
        } else {
          const noDataMessage = document.createElement("div");
          noDataMessage.className = "small dimmed";
          noDataMessage.innerText = "Forsøker å laste inn artikkel...";
          wrapper.appendChild(noDataMessage);
        }
      
        return wrapper;
      },
      

    getStyles: function () {
        return ["MMM-Today.css"];
    },
});