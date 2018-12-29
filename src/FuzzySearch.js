class FuzzySearch {
    constructor(haystack = [], keys = [], options = {}) {
        if (!Array.isArray(keys)) {
            options = keys;
            keys = [];
        }

        this.haystack = haystack;
        this.keys = keys;
        this.options = Object.assign({
            caseSensitive: false,
            sort: false,
        }, options);
    }

    getDescendantProperty(object, path, list = []) {
        let firstSegment;
        let remaining;
        let dotIndex;
        let value;
        let index;
        let length;

        if (path) {
            dotIndex = path.indexOf('.');

            if (dotIndex === -1) {
                firstSegment = path;
            } else {
                firstSegment = path.slice(0, dotIndex);
                remaining = path.slice(dotIndex + 1);
            }

            value = object[firstSegment];
            if (value !== null && typeof value !== 'undefined') {
                if (!remaining && (typeof value === 'string' || typeof value === 'number')) {
                    list.push(value);
                } else if (Object.prototype.toString.call(value) === '[object Array]') {
                    for (index = 0, length = value.length; index < length; index++) {
                        this.getDescendantProperty(value[index], remaining, list);
                    }
                } else if (remaining) {
                    this.getDescendantProperty(value, remaining, list);
                }
            }
        } else {
            list.push(object);
        }

        return list;
    }

    search(query = '') {
        if (query === '') {
            return this.haystack;
        }

        const results = [];

        for (let i = 0; i < this.haystack.length; i++) {
            const item = this.haystack[i];

            if (this.keys.length === 0) {
                const score = this.isMatch(item, query, this.options.caseSensitive);

                if (score) {
                    results.push({
                        item,
                        score
                    });
                }
            } else {
                for (let y = 0; y < this.keys.length; y++) {
                    const propertyValues = this.getDescendantProperty(item, this.keys[y]);

                    let found = false;

                    for (let z = 0; z < propertyValues.length; z++) {
                        const score = this.isMatch(propertyValues[z], query, this.options.caseSensitive);

                        if (score) {
                            found = true;

                            results.push({
                                item,
                                score
                            });

                            break;
                        }
                    }

                    if (found) {
                        break;
                    }
                }
            }
        }

        if (this.options.sort) {
            results.sort((a, b) => a.score - b.score);
        }

        return results.map(result => result.item);
    }

    isMatch(item, query, caseSensitive) {
        if (!caseSensitive) {
            item = item.toLocaleLowerCase();
            query = query.toLocaleLowerCase();
        }

        const letters = query.split('');
        const indexes = [];

        let index = 0;

        for (let i = 0; i < letters.length; i++) {
            const letter = letters[i];

            index = item.indexOf(letter, index);

            if (index === -1) {
                return false;
            }

            indexes.push(index);

            index++;
        }

        // Exact matches should be first.
        if (item === query) {
            return 1;
        }

        // If we have more than 2 letters, matches close to each other should be first.
        if (indexes.length > 1) {
            return 2 + (indexes[indexes.length - 1] - indexes[0]);
        }


        // Matches closest to the start of the string should be first.
        return 2 + indexes[0];
    }
}

module.exports = FuzzySearch;