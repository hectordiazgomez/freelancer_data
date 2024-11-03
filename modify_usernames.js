import fs from 'fs';

fs.readFile('usa_usernames.json', 'utf8', (err, data) => {
    if (err) {
        console.error('Error reading the file:', err);
        return;
    }
    try {
        const usernames = JSON.parse(data);
        const cleanUsernames = usernames.map(username => username.replace('/u/', ''));
        const cleanedData = JSON.stringify(cleanUsernames, null, 2);
        fs.writeFile('cleaned_usernames.json', cleanedData, 'utf8', (err) => {
            if (err) {
                console.error('Error writing to file:', err);
                return;
            }
            console.log('Successfully created cleaned_usernames.json');
        });
    } catch (error) {
        console.error('Error parsing JSON:', error);
    }
});