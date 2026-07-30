import objectPath from 'object-path';

export default function processFiles(body, files = []) {
    files.forEach(
        file => objectPath.set(body, file.fieldname.replace(/\]\[/g, '.').replace(/[[,\]]/g, '.').replace(/\.$/g, ''), file)
    );

    return body;
}
