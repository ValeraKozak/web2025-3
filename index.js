const fs = require('fs');
const https = require('https');
const { program } = require('commander');

const API_URL = 'https://bank.gov.ua/NBUStatService/v1/statdirectory/exchange?valcode=USD&date=20220707&date_end=20220719&json';

function fetchAndSaveData(filePath) {
    return new Promise((resolve, reject) => {
        https.get(API_URL, (res) => {
            let data = '';

            res.on('data', (chunk) => {
                data += chunk;
            });

            res.on('end', () => {
                try {
                    const jsonData = JSON.parse(data);
                    fs.writeFileSync(filePath, JSON.stringify(jsonData, null, 2), 'utf8');
                    console.log('Дані успішно збережено у', filePath);
                    resolve(jsonData);
                } catch (error) {
                    reject('Помилка при обробці JSON: ' + error);
                }
            });
        }).on('error', (err) => {
            reject('Помилка запиту: ' + err.message);
        });
    });
}

program
  .option('-i, --input <path>', 'Input JSON file')
  .option('-o, --output <path>', 'Output file')
  .option('-d, --display', 'Display result in console');
  

program.parse(process.argv);

const options = program.opts();
if (!options.input) {
    console.error('Помилка: параметр -i (input) є обов\'язковим.');
    program.help(); // Виводить допомогу і завершує програму
}
(async () => {
    if (!fs.existsSync(options.input)) {
        console.log('Файл не знайдено, завантажуємо нові дані...');
        await fetchAndSaveData(options.input);
    }

    try {
        const data = JSON.parse(fs.readFileSync(options.input, 'utf8'));
        
        const maxRate = Math.max(...data.map(item => item.rate));
        const result = `Максимальний курс: ${maxRate}`;
        
        if (options.display) {
            console.log(result);
        }

        if (options.output) {
            fs.writeFileSync(options.output, result, 'utf8');
        }
    } catch (error) {
        console.error('Помилка обробки файлу:', error.message);
        process.exit(1);
    }
})();
