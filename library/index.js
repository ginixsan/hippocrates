// Node modules.
const events = require(`events`),
    fs = require(`fs`);
// Dependencies.
const AudioRecorder = require('mic');
const { Models, Detector } = require(`snowboy`);

const defaultModel = {
    file: `./node_modules/snowboy/resources/snowboy.umdl`,
    hotwords : `snowboy`,
    sensitivity: 0.5
};
const defaultDetector = {
    resource: `./node_modules/snowboy/resources/common.res`,
};
const defaultRecorder = {
    silence: 0
};

let audioRecorder,
    models,
    detector,
    detectorOptions,
    micInputStream;

/**
 * Sets up new detector instance.
 * It has to be recreated each time the detection is started or resumed as the detectors stream will close automatically when nothing is piped to the service.
 */
const setupDetector = function(instance) {
    if (detector) {
        detector.reset();
    }

    // Create snowboy detector.
    detector = new Detector(detectorOptions);
    // Give through the error event.
    detector.on(`error`, function() {
        const message = `HotwordDetector: detection error.`;
        if (instance.logger) {
            instance.logger.warn(message);
        }
        instance.emit(`error`, message);
    });
    // Give through the hotword event.
    detector.on(`hotword`, function(index, hotword, buffer) {
        if (instance.logger) {
            instance.logger.log(`HotwordDetector: hotword detected, index: '${index}', hotword: '${hotword}'.`);
        }
        instance.emit(`hotword`, index, hotword, buffer);
    });
    // Give through the silence event.
    detector.on(`silence`, function() {
        instance.emit(`silence`);
    });
    // Give through the sound event.
    detector.on(`sound`, function(buffer) {
        instance.emit(`sound`, buffer);
    });
};

class HotwordDetector extends events.EventEmitter {
    /**
     * Constructor of HotwordDetector class.
     * @param {*} detectorData Detector data
     * @param {*} modelData Array of model data
     * @param {*} recorderData Recorder data
     * @param {*} logger Object with log, warn, and error functions
     * @returns this
     */
    constructor(detectorData, modelData, recorderData, logger) {
        super();

        // Store logger.
        this.logger = logger;

        // Create snowboy models, add each given model.
        models = new Models();
        // If no model data given add a default one.
        if (!modelData || modelData.length < 1) {
            modelData = [ defaultModel ];
        }
        let model;
        for (let i = 0; i < modelData.length; i++) {
            model = modelData[i];
            // Check if model file is present.
            if (fs.existsSync(model.file)) {
                models.add(model);
            }
            else if (this.logger) {
                this.logger.warn(`HotwordDetector: Model file not found '${model.file}'.`);
            }
        }

        // Store detector options.
        detectorOptions = Object.assign(defaultDetector, detectorData, { models: models });

        // Audio recorder instance.
       // audioRecorder = new AudioRecorder(Object.assign(defaultRecorder, recorderData), this.logger);
        audioRecorder=AudioRecorder({
            rate: '16000',
            channels: '1',
            debug: true,
            exitOnSilence: 0
        });


        // Log successful initialization.
        if (this.logger) {
            logger.log(`HotwordDetector: Initialized.`);
        }

        return this;
    }
    /**
     * Start detection.
     * @returns this
     */
    start() {
        setupDetector(this);
        micInputStream = audioRecorder.getAudioStream();
        micInputStream.pipe(detector);
        audioRecorder.start();



        if (this.logger) {
            this.logger.log(`HotwordDetector: Started detecting.`);
        }

        return this;
    }
    /**
     * Stop detection.
     * @returns this
     */
    stop() {
        detector = null;
        if (audioRecorder) {
            micInputStream.unpipe(detector);
            micInputStream=void(0);
            audioRecorder.stop();
        }

        if (this.logger) {
            this.logger.log(`HotwordDetector: Stopped detecting.`);
        }

        return this;
    }
}

module.exports = HotwordDetector;
