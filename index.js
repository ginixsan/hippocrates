const HotwordDetector=require('hotwordwrapper');

function para(hotDetector)
{
    hotDetector.stop();
}
function empieza()
{
    // Options hotword detector.
    const detectorData = {
        resource: `./resources/common.res`
    };
    const modelData = [{
        file: `./resources/hipocrates.pmdl`,
        hotwords : `hipocrates`,
        sensitivity: 0.5
    }];
    const recorderData = {
        rate: '16000',
        channels: '1',
        debug: false,
        exitOnSilence: 0
    };

// Initialize detector.
    const hotwordDetector = new HotwordDetector(detectorData, modelData, recorderData, null);
// Triggered when an error is encountered.
    hotwordDetector.on(`error`, function(error) {
        throw error;
    });
// Triggered when a hotword has been detected.
    hotwordDetector.on(`hotword`, function(index, hotword, buffer) {
        // Index is the associated index of the detected hotword.
        // Hotword is a string of which word has been detected.
        // Buffer is the most recent section from the audio buffer.
        console.log(`Hotword detected: ${index}, ${hotword}`);
        // Stop detecting.
        para(hotwordDetector);

        // Exit the program, perhaps here you want to re-enable the hotword detector again.


    });
// Triggered when there is no audible sound being recorded.
    hotwordDetector.on(`silence`, function() {
        //console.log(`Silence...`);
    });
    hotwordDetector.start();
}

// Start recording and detecting.
setTimeout(function () {
    console.log('timeout completed');
    empieza();
}, 20000);
empieza();
