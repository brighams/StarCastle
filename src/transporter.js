// transporter_effect: (magnitude, volume) => { // unused but cool
//   const now = audioCtx.currentTime;
//   const duration = 1.2;
//
//   // === MAIN TRANSPORTER SWEEP: High → Low → Mid ===
//   const sweepGain = audioCtx.createGain();
//   sweepGain.gain.setValueAtTime(0.001, now);
//   sweepGain.gain.exponentialRampToValueAtTime(volume * 0.6, now + 0.1);
//   sweepGain.gain.setValueAtTime(volume * 0.5, now + duration * 0.7);
//   sweepGain.gain.exponentialRampToValueAtTime(0.001, now + duration);
//   sweepGain.connect(audioCtx.destination);
//
//   // Primary sweep oscillator - the iconic pitch contour
//   const sweepOsc = audioCtx.createOscillator();
//   sweepOsc.type = 'sine';
//   sweepOsc.frequency.setValueAtTime(2400 * magnitude, now);           // Start high
//   sweepOsc.frequency.exponentialRampToValueAtTime(200 * magnitude, now + duration * 0.5);  // Drop low
//   sweepOsc.frequency.exponentialRampToValueAtTime(600 * magnitude, now + duration * 0.9);  // Rise to mid
//   sweepOsc.frequency.linearRampToValueAtTime(500 * magnitude, now + duration);
//   sweepOsc.connect(sweepGain);
//   sweepOsc.start(now);
//   sweepOsc.stop(now + duration);
//
//   // Secondary harmonic sweep for richness
//   const sweep2Gain = audioCtx.createGain();
//   sweep2Gain.gain.setValueAtTime(0.001, now);
//   sweep2Gain.gain.exponentialRampToValueAtTime(volume * 0.3, now + 0.15);
//   sweep2Gain.gain.exponentialRampToValueAtTime(0.001, now + duration);
//   sweep2Gain.connect(audioCtx.destination);
//
//   const sweep2Osc = audioCtx.createOscillator();
//   sweep2Osc.type = 'triangle';
//   sweep2Osc.frequency.setValueAtTime(1800 * magnitude, now);
//   sweep2Osc.frequency.exponentialRampToValueAtTime(150 * magnitude, now + duration * 0.5);
//   sweep2Osc.frequency.exponentialRampToValueAtTime(450 * magnitude, now + duration * 0.9);
//   sweep2Osc.connect(sweep2Gain);
//   sweep2Osc.start(now);
//   sweep2Osc.stop(now + duration);
//
//   // === STAR TREK SPARKLE/SHIMMER (the "fuzz") ===
//   // Fast warbling for that shimmering materialization effect
//   const shimmerGain = audioCtx.createGain();
//   shimmerGain.gain.setValueAtTime(0.001, now);
//   shimmerGain.gain.exponentialRampToValueAtTime(volume * 0.4, now + 0.2);
//   shimmerGain.gain.setValueAtTime(volume * 0.35, now + duration * 0.6);
//   shimmerGain.gain.exponentialRampToValueAtTime(0.001, now + duration);
//   shimmerGain.connect(audioCtx.destination);
//
//   const shimmerOsc = audioCtx.createOscillator();
//   shimmerOsc.type = 'sawtooth';
//   shimmerOsc.frequency.setValueAtTime(3000 * magnitude, now);
//   shimmerOsc.frequency.exponentialRampToValueAtTime(800 * magnitude, now + duration * 0.5);
//   shimmerOsc.frequency.exponentialRampToValueAtTime(1200 * magnitude, now + duration);
//
//   // LFO for rapid tremolo - creates the sparkle effect
//   const lfo = audioCtx.createOscillator();
//   const lfoGain = audioCtx.createGain();
//   lfo.frequency.setValueAtTime(30, now);  // Fast warble
//   lfo.frequency.linearRampToValueAtTime(15, now + duration);  // Slow down as materializing completes
//   lfoGain.gain.setValueAtTime(400, now);
//   lfo.connect(lfoGain);
//   lfoGain.connect(shimmerOsc.frequency);
//   lfo.start(now);
//   lfo.stop(now + duration);
//
//   shimmerOsc.connect(shimmerGain);
//   shimmerOsc.start(now);
//   shimmerOsc.stop(now + duration);
//
//   // === FILTERED NOISE for that classic transporter texture ===
//   const bufferSize = audioCtx.sampleRate * duration;
//   const noiseBuffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
//   const output = noiseBuffer.getChannelData(0);
//   for (let i = 0; i < bufferSize; i++) {
//     output[i] = Math.random() * 2 - 1;
//   }
//
//   const noiseSource = audioCtx.createBufferSource();
//   noiseSource.buffer = noiseBuffer;
//
//   // Bandpass filter sweeping with the main sound
//   const noiseFilter = audioCtx.createBiquadFilter();
//   noiseFilter.type = 'bandpass';
//   noiseFilter.frequency.setValueAtTime(4000 * magnitude, now);
//   noiseFilter.frequency.exponentialRampToValueAtTime(600 * magnitude, now + duration * 0.5);
//   noiseFilter.frequency.exponentialRampToValueAtTime(1000 * magnitude, now + duration);
//   noiseFilter.Q.setValueAtTime(5, now);
//
//   const noiseGain = audioCtx.createGain();
//   noiseGain.gain.setValueAtTime(0.001, now);
//   noiseGain.gain.exponentialRampToValueAtTime(volume * 0.25, now + 0.1);
//   noiseGain.gain.setValueAtTime(volume * 0.2, now + duration * 0.6);
//   noiseGain.gain.exponentialRampToValueAtTime(0.001, now + duration);
//
//   noiseSource.connect(noiseFilter);
//   noiseFilter.connect(noiseGain);
//   noiseGain.connect(audioCtx.destination);
//
//   noiseSource.start(now);
//   noiseSource.stop(now + duration);
//
//   // === MATERIALIZATION "CHIME" at the end ===
//   const chimeStart = now + duration * 0.75;
//   const chimeGain = audioCtx.createGain();
//   chimeGain.gain.setValueAtTime(0.001, chimeStart);
//   chimeGain.gain.exponentialRampToValueAtTime(volume * 0.4, chimeStart + 0.05);
//   chimeGain.gain.exponentialRampToValueAtTime(0.001, chimeStart + 0.3);
//   chimeGain.connect(audioCtx.destination);
//
//   const chimeOsc = audioCtx.createOscillator();
//   chimeOsc.type = 'sine';
//   chimeOsc.frequency.setValueAtTime(800 * magnitude, chimeStart);
//   chimeOsc.frequency.linearRampToValueAtTime(600 * magnitude, chimeStart + 0.2);
//   chimeOsc.connect(chimeGain);
//   chimeOsc.start(chimeStart);
//   chimeOsc.stop(chimeStart + 0.3);
// },
