const { AkairoClient } = require('discord-akairo');

class PlatronClient extends AkairoClient {
    build() {
        return super.build();
    }

    loadAll() {
        super.loadAll();
    }
}

module.exports = PlatronClient;
