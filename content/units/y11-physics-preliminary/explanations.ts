import type { ExplanationTable } from "../../explanation-helpers";

// ANSWER KEY — why each wrong multiple-choice option is wrong (spec 002). Shown to a student only
// after they answer that question. Each entry is [the start of the wrong option's text, the
// explanation]; the helper resolves it to the full option text and fails if it does not match
// exactly one wrong option. Original wording, one or two sentences each.

export const explanations: ExplanationTable = {
  1: [
    ["Distance", "Distance only tells you how much ground was covered, not which way, so it is a scalar."],
    ["Speed", "Speed is how fast something moves with no direction attached, so it is a scalar."],
    ["Time", "Time has a size but no direction, so it is a scalar."],
  ],
  2: [
    ["0 m and 0 m", "The runner did cover 400 m of track. Distance counts the whole path, even though they ended where they began."],
    ["0 m and 400 m", "These are the wrong way round: the distance is the 400 m path, and the displacement is the 0 m change in position."],
    ["400 m and 400 m", "Displacement is only the straight-line change from start to finish. They finished where they started, so it is 0 m."],
  ],
  3: [
    ["average speed", "The gradient at one point is the rate at that instant, not an average over the whole trip, and it has direction, so it is velocity rather than speed."],
    ["acceleration", "Acceleration is the gradient of a velocity–time graph. On a displacement–time graph the gradient is velocity."],
    ["total distance", "Total distance is not read from a gradient at a point; the gradient shows how quickly displacement is changing at that moment."],
  ],
  4: [
    ["speeding up", "A constant speeding up would show as a sloping line. A flat section means the velocity is not changing."],
    ["slowing down", "Slowing down would show as a line sloping toward the axis. The middle section is flat, so the velocity stays the same."],
    ["stationary", "A stationary object would sit on the time axis at zero velocity. The flat section is above the axis, so the object is still moving."],
  ],
  5: [
    ["final velocity", "The final velocity is read from the height of the line at the end, not from the area under it."],
    ["acceleration", "Acceleration is the gradient of the line. The area under it is velocity multiplied by time."],
    ["average velocity", "Average velocity would be found by dividing the displacement by the time. The area itself is the displacement."],
  ],
  6: [
    ["it is moving in a straight", "An object can move in a straight line at constant velocity, which is not accelerating at all."],
    ["a force acts", "Balanced forces cancel to a net force of zero, so the velocity does not change and there is no acceleration."],
    ["it is moving at a high", "A fast object at constant velocity is not accelerating. Acceleration is about changing velocity, not how large it is."],
  ],
  7: [
    ["gradually slow", "Objects only slow down when a force such as friction acts on them. With zero net force, nothing slows the object."],
    ["always be at rest", "Zero net force only means no change in motion, so a moving object keeps moving at the same velocity."],
    ["accelerate in", "Acceleration needs a net force. With none, the object keeps its velocity rather than speeding up."],
  ],
  8: [
    ["zero acceleration", "A net force still acts, so there is some acceleration. The larger mass just makes it smaller."],
    ["the same acceleration", "Acceleration depends on mass as well as force. For the same force, more mass means less acceleration."],
    ["a larger", "It is the other way around: a larger mass is harder to accelerate, so the acceleration is smaller."],
  ],
  9: [
    ["the weight of the table", "A reaction force must be a pair with the original force and act on a different object. The table's weight is a different force altogether."],
    ["the friction", "Friction acts sideways along the surface and is not the pair of the Earth's pull on the book."],
    ["the normal force", "The normal force acts on the book and balances its weight, but both act on the same object. A third-law pair acts on two different objects."],
  ],
  10: [
    ["the driving force is greater", "If the driving force were greater, there would be a forward net force and the car would keep speeding up."],
    ["there is no friction", "Friction and air resistance are acting. The driving force is simply large enough to cancel them."],
    ["the net force is directed", "A forward net force would make the car accelerate. At constant velocity the net force is zero."],
  ],
  11: [
    ["always zero", "Static friction is what stops an object starting to slide, so its maximum is not zero."],
    ["exactly the same", "It usually takes a little more force to start an object moving than to keep it moving, so the two are not equal."],
    ["much smaller", "Maximum static friction is normally a bit larger than kinetic friction, not much smaller."],
  ],
  12: [
    ["directed up", "A net force up the slope would slow the block to a stop. It is sliding at constant velocity, so there is no net force."],
    ["equal to the block", "Weight is only one of the forces. Friction and the normal force also act, and together all of them cancel."],
    ["directed down", "A net force down the slope would make the block speed up. Constant velocity means the forces balance."],
  ],
  13: [
    ["a force is applied", "A force that does not move the object, such as pushing on a wall, does no work."],
    ["the object moves, whether", "Work needs a force as well as movement. An object that moves with no force acting on it has no work done on it."],
    ["the force is perpendicular", "A force at right angles to the motion has no component along the motion, so it does no work."],
  ],
  14: [
    ["both decrease", "Only the kinetic energy decreases as the ball slows. Its gravitational potential energy increases as it climbs."],
    ["increase and decrease", "These are reversed. The ball slows as it rises, losing kinetic energy, and gains height, gaining potential energy."],
    ["both increase", "Both cannot increase because energy is only being transformed. The kinetic energy lost is what the potential energy gains."],
  ],
  15: [
    ["no kinetic energy", "Momentum is conserved even in collisions where kinetic energy is lost. The condition for momentum is no net external force."],
    ["the objects have equal", "Conservation of momentum holds for any masses. What matters is that no net external force acts."],
    ["the collision is perfectly", "Momentum is conserved in inelastic collisions as well. Being elastic is a condition for kinetic energy, not momentum."],
  ],
  16: [
    ["kinetic energy is conserved but", "This is backwards. Momentum is conserved in every isolated collision, and kinetic energy is lost when the objects stick."],
    ["both momentum", "Kinetic energy is not conserved in an inelastic collision. Some of it becomes heat, sound or deformation."],
    ["neither", "Momentum is conserved in all isolated collisions, including perfectly inelastic ones."],
  ],
  17: [
    ["reduce the car's speed", "The car's speed before the crash is not changed by the crumple zone. It works during the impact."],
    ["increase the mass", "Crumple zones do not add mass. They spread the stopping over a longer time."],
    ["decrease the change", "The car still has to lose all its momentum. The crumple zone makes the change take longer, which lowers the force."],
  ],
  18: [
    ["the same momentum and twice", "Momentum depends on mass, so the heavier car has more of it. Both quantities double."],
    ["twice the momentum and the same", "Kinetic energy also depends on mass, so with twice the mass it is twice as large."],
    ["the same momentum and the same", "The heavier car has twice the mass, so both its momentum and its kinetic energy are twice as large."],
  ],
  19: [
    ["in the same direction", "Oscillating along the direction of energy transfer describes a longitudinal wave, such as sound."],
    ["in circles", "Particles in a transverse wave move up and down across the direction of travel. They do not travel along with the wave."],
    ["parallel", "Oscillating parallel to the direction of travel describes a longitudinal wave, not a transverse wave."],
  ],
  20: [
    ["transverse", "Sound is a longitudinal wave. Air particles move back and forth along the direction the wave travels, so there are no crests or troughs."],
    ["wave that does not need", "Sound is a mechanical wave and needs a medium, such as air, for its particles to pass the vibration along."],
    ["standing", "A standing wave is a pattern made by two waves overlapping. A sound travelling through air is a travelling wave."],
  ],
  21: [
    ["frequency and wavelength", "X is a wavelength, but Y is measured from the axis to a crest, which is the amplitude, not the frequency."],
    ["period and frequency", "These are not distances. X and Y are both lengths on the diagram, so they are wavelength and amplitude."],
    ["amplitude and wavelength", "These are in the wrong order. Crest to crest is the wavelength (X) and axis to crest is the amplitude (Y)."],
  ],
  22: [
    ["distance between", "The distance between adjacent crests is the wavelength. The period is a length of time."],
    ["maximum displacement", "This describes amplitude, a distance from the rest position, not a time."],
    ["number of waves", "This is the frequency. The period is the time for one wave, which is one divided by the frequency."],
  ],
  23: [
    ["double", "Frequency and wavelength are inversely related when the speed is fixed, so raising the frequency makes the wavelength shorter."],
    ["quadruple", "The wavelength gets shorter, not longer. Doubling the frequency halves it."],
    ["stay the same", "With the speed fixed, v = fλ means that if one of f and λ changes the other must change too."],
  ],
  24: [
    ["Gamma rays", "Gamma rays have some of the shortest wavelengths in the spectrum, much shorter than radio waves."],
    ["Radio waves travel faster", "All electromagnetic waves travel at the same speed in a vacuum. They differ in frequency and wavelength."],
    ["Electromagnetic waves need", "Electromagnetic waves can travel through a vacuum. That is how sunlight reaches Earth."],
  ],
  25: [
    ["decreases in proportion to the distance", "The light spreads over the surface of a sphere, whose area grows with the square of the distance, so the fall is faster than proportional."],
    ["stays", "The same light is spread over a larger area as it travels outward, so it gets dimmer."],
    ["increases", "Light spreads out as it travels away from a point source, so its intensity decreases."],
  ],
  26: [
    ["back along", "Light that went back along its path would be reflected, not refracted. Entering glass it carries on through, but bent."],
    ["away from", "Bending away from the normal happens when light speeds up, for example going from glass into air. Slowing down bends it toward the normal."],
    ["along the boundary", "Light only travels along the boundary at the critical angle when leaving a denser medium. Entering glass it passes through, bent toward the normal."],
  ],
  27: [
    ["the density", "Refractive index is about the speed of light in the medium, not its mass density. A denser material does not always have a higher refractive index."],
    ["the colour", "Refractive index compares the speed of light in the material with its speed in a vacuum. It is not a measure of colour."],
    ["how transparent", "Transparency is how much light gets through. Refractive index is how much the light is slowed down."],
  ],
  28: [
    ["from a medium of lower", "Going from less dense to more dense, light bends toward the normal and always passes into the second medium, so there is no total internal reflection."],
    ["through a vacuum", "Total internal reflection needs a boundary between two different media. A single vacuum has no boundary to reflect from."],
    ["along the normal", "Light travelling along the normal hits the boundary at an angle of incidence of zero, which is less than the critical angle, so it passes straight through."],
  ],
  29: [
    ["exactly twice", "A gap twice as wide as the wavelength still diffracts a little, but the effect is much weaker than when the gap is close to the wavelength or smaller."],
    ["unrelated", "The size of the gap compared with the wavelength is what decides how much diffraction there is."],
    ["much larger", "Waves pass through a much larger gap almost without spreading, so the diffraction is hard to notice."],
  ],
  30: [
    ["total internal", "Total internal reflection is about light reflecting at a boundary. It has nothing to do with two waves meeting."],
    ["constructive", "Constructive interference happens when two crests meet. A crest and a trough have opposite displacements and cancel."],
    ["a standing", "A standing wave is a lasting pattern from two waves travelling in opposite directions. One crest meeting one trough at a point is just destructive interference."],
  ],
  31: [
    ["compressions", "Compressions are regions where particles are squeezed together in a longitudinal wave. The still points on a string are nodes."],
    ["antinodes", "Antinodes are the points of largest movement. The points that never move are the nodes."],
    ["crests", "A crest is the highest point of a wave, which is moving. Points that never move are nodes."],
  ],
  32: [
    ["travelling faster", "The speed of sound in air depends on the air, not the source. The pitch changes because of the shorter wavelength, not a faster wave."],
    ["louder", "Loudness depends on amplitude, but the pitch is the frequency, and the frequency does change. The waves are squashed together."],
    ["stretched", "Stretched waves with a lower frequency are what you hear as the siren moves away. As it approaches, the waves are squashed."],
  ],
  33: [
    ["speed has", "All light travels at the same speed in a vacuum. Redshift is a change in wavelength, not speed."],
    ["brightness", "Redshift is about the wavelength being stretched, not about how bright the galaxy looks."],
    ["observed wavelength is shorter", "A shorter wavelength is a blueshift, which happens when a source moves toward us. Red light has a longer wavelength."],
  ],
  34: [
    ["higher in pitch", "Pitch depends on frequency, and the frequency is unchanged. Amplitude changes how loud the sound is."],
    ["lower in pitch", "Pitch depends on frequency, which is the same, so the pitch does not change. A larger amplitude makes it louder."],
    ["travel faster", "The speed of sound depends on the medium it travels through. Making it louder does not change its speed."],
  ],
  35: [
    ["electrons have been transferred from the rod", "If the rod lost electrons it would be positively charged. To become negative it must gain them."],
    ["the rod has created", "Charge is never created. Rubbing just moves electrons from one object to the other."],
    ["protons", "Protons are fixed in the nucleus and do not move when objects are rubbed. It is the electrons that transfer."],
  ],
  36: [
    ["neutral", "A neutral object has no net charge and so no field around it. Field lines pointing outward show a source of the field."],
    ["negative", "Field lines point toward negative charges. Lines pointing away mean the charge is positive."],
    ["moving", "The diagram shows a field, which any stationary charge has. It does not show if the charge is moving."],
  ],
  37: [
    ["both neutral", "Neutral objects do not produce an electric field, so there would be no field lines at all."],
    ["both positive", "Two positive charges both push field lines outward, so the lines would curve away from each other rather than run from one to the other."],
    ["both negative", "Two negative charges both pull lines inward, so the lines would not run from one charge to the other."],
  ],
  38: [
    ["twice as large", "The force gets weaker with distance, so doubling the distance cannot make it stronger."],
    ["half as large", "The force depends on the square of the distance, so doubling the distance cuts the force by a factor of four, not two."],
    ["four times", "The force decreases as the charges move apart. Doubling the distance divides the force by four."],
  ],
  39: [
    ["zero everywhere", "The oppositely charged plates create a field between them. It is only the field outside the plates that is close to zero."],
    ["directed along", "The field points from the positive plate to the negative plate, across the gap, not along the plates."],
    ["strongest in", "Between parallel plates the field has the same strength at every point, apart from near the edges."],
  ],
  40: [
    ["energy,", "Current is a flow of charge. The energy is carried by the charges, but it is not what flows."],
    ["positive charge, from the negative", "Conventional current runs from the positive terminal to the negative terminal, not the other way."],
    ["electrons,", "Electrons do carry the current in a metal, but they flow from the negative terminal to the positive. Conventional current is defined as the flow of positive charge."],
  ],
  41: [
    ["made thicker", "A thicker wire gives the charges more room to flow, so its resistance goes down."],
    ["made from a better", "A better conductor opposes the flow less, so its resistance is lower."],
    ["cooled", "For a metal wire, a lower temperature means less resistance. Heating it raises the resistance."],
  ],
  42: [
    ["become four", "For an ohmic conductor, the current is proportional to the voltage, not its square. Doubling the voltage doubles the current."],
    ["stay the same", "A higher voltage pushes more current through a fixed resistance, so the current does not stay the same."],
    ["halve", "Current rises with voltage for an ohmic conductor. Doubling the voltage doubles the current."],
  ],
  43: [
    ["decrease and increase", "Resistors in series add, so the total resistance rises rather than falls. With more resistance the current is smaller."],
    ["both stay", "Each extra resistor adds to the total resistance, which reduces the current, so neither stays the same."],
    ["both increase", "The total resistance rises as resistors are added, but that makes the current fall, not rise."],
  ],
  44: [
    ["half the supply", "In a parallel circuit each branch is connected straight across the supply, so it gets the full supply voltage."],
    ["zero", "Each branch is connected across the supply and has the full supply voltage across it."],
    ["different", "The branches may carry different currents, but the voltage across each one is the same."],
  ],
  45: [
    ["stay the same", "A second parallel path gives the current an extra route, so the total resistance changes: it goes down."],
    ["increase", "Adding resistors in series would increase the resistance. A parallel path lets more current through, so the total falls."],
    ["become the sum", "Adding the resistances applies to resistors in series. In parallel the total is lower than either resistor on its own."],
  ],
  46: [
    ["the meters would", "Wrong connections could damage a meter or give false readings, but that is a consequence, not the reason. The positions come from what each meter has to measure: the current through the component, and the voltage across it."],
    ["it makes the circuit", "How easy a circuit is to draw is not the reason. The positions are needed to measure current and voltage correctly."],
    ["an ammeter has", "It is the other way around: an ammeter has a very low resistance and a voltmeter a very high resistance."],
  ],
  47: [
    ["out of both", "Field lines run from a north pole to a south pole, so they cannot leave both ends."],
    ["from the south", "By convention the lines leave the north pole and enter the south pole outside the magnet."],
    ["into both", "Field lines run from a north pole to a south pole, so they cannot enter both ends."],
  ],
  48: [
    ["straight lines pointing", "A current-carrying wire does not have a field that points straight out. The field curls around it."],
    ["a uniform field", "A uniform field has parallel lines of equal spacing. The field around a wire gets weaker with distance and curves around the wire."],
    ["straight lines parallel", "The field does not run along the wire. It forms circles around it, and the direction follows the right-hand grip rule."],
  ],
  49: [
    ["unchanged", "A bigger current makes a stronger field, so the field inside does not stay the same."],
    ["reverse", "Changing the size of the current does not change the direction. The direction only reverses if the current direction is reversed."],
    ["weaker", "The field strength in a solenoid goes up with the current, so more current makes it stronger."],
  ],
  50: [
    ["keeps its magnetism", "That describes steel. A permanent magnet is no good in an electromagnet that needs to switch off."],
    ["does not conduct", "Soft iron is chosen for its magnetic properties. It does conduct electricity, though the core is not what carries the current."],
    ["is a stronger permanent", "Soft iron is not a permanent magnet. It is useful because it is magnetised only while the current flows."],
  ],
  51: [
    ["The cyclist's velocity is constant", "Velocity includes direction. The cyclist's direction keeps changing around the track, so the velocity is not constant even though the speed is."],
    ["The cyclist's speed must", "The question says the speed is constant. It is the direction, and so the velocity, that changes."],
    ["The cyclist has zero", "Acceleration is any change in velocity, and a change of direction counts. The cyclist is always accelerating toward the centre of the track."],
  ],
  52: [
    ["Speed (vector)", "Speed has no direction, so it is a scalar. Displacement has direction, so it is a vector. These labels are swapped."],
    ["Energy (vector)", "Energy has a size but no direction, so it is a scalar, not a vector."],
    ["Force (scalar)", "Force has a direction as well as a size, so it is a vector, and time is a scalar. These labels are swapped."],
  ],
  53: [
    ["zero once", "Gravity keeps acting on the ball however fast it goes. With no air resistance, nothing cancels it, so the acceleration does not drop to zero."],
    ["increasing", "The speed increases, but the acceleration stays the same. The ball gains the same amount of speed every second."],
    ["decreasing", "The acceleration does not shrink as the ball speeds up. Without air resistance it stays constant."],
  ],
  54: [
    ["at rest", "An object at rest would sit on the time axis at zero velocity. This line is above the axis, so the object is moving."],
    ["decelerating", "A decelerating object would have a line sloping downward toward the axis. A flat line means the velocity is not changing."],
    ["accelerating", "An accelerating object would have a sloping line. A horizontal line means there is no acceleration."],
  ],
  55: [
    ["uniform deceleration", "A positive slope means the velocity is increasing, so this is speeding up. Deceleration would slope downward."],
    ["no motion", "No motion would be a flat line along the axis. A sloping line means the velocity is changing."],
    ["constant velocity", "Constant velocity is a flat line. A line with a constant slope means the velocity is changing at a steady rate."],
  ],
  56: [
    ["The second law", "F = ma applies to the passenger as well as the car. The passenger keeps moving because no force is acting on them to stop them, which is the first law."],
    ["The third law", "The third law is true but does not explain why the passenger keeps moving forward. That is inertia, from the first law."],
    ["The law of conservation", "Energy conservation is true but is not what explains the passenger carrying on moving. That is inertia, from Newton's first law."],
  ],
  57: [
    ["the lighter", "Without air resistance, gravity gives every object the same acceleration, so a lighter object does not fall slower or faster."],
    ["this cannot", "Mass does not matter here. All objects fall with the same acceleration in a vacuum, so they land together."],
    ["the heavier", "A heavier object has a bigger weight, but also more mass to accelerate, so the two effects cancel and all objects fall together."],
  ],
  58: [
    ["in a fixed", "Friction changes direction with the motion. It always points against the way the surfaces are sliding."],
    ["perpendicular", "Friction acts along the surface, not at right angles to the motion. The force at right angles to a surface is the normal force."],
    ["in the same direction", "Friction slows moving objects, so it points the opposite way to the motion."],
  ],
  59: [
    ["quadruple", "Acceleration is proportional to the net force, not its square. Doubling the force doubles the acceleration."],
    ["leave", "With mass constant, a larger net force gives a larger acceleration."],
    ["halve", "A bigger force gives a bigger acceleration. Halving would happen if the mass doubled."],
  ],
  60: [
    ["their parachute", "Terminal velocity is about the forces balancing, not the parachute. A skydiver can reach it with or without a parachute open."],
    ["gravity has", "Gravity still acts on the skydiver. The upward drag has grown until it equals the weight."],
    ["air resistance has disappeared", "Air resistance is the force that balances their weight. It has not disappeared; it has grown until it matches the weight."],
  ],
  61: [
    ["A satellite", "The gravitational force on a satellite in a circular orbit is at right angles to its motion, so it does no work."],
    ["A person pushes against", "The wall does not move, so there is no displacement and no work is done, however hard the person pushes."],
    ["A person holds", "The bag does not move, so no work is done on it, even though holding it is tiring."],
  ],
  62: [
    ["increase and decrease", "These are swapped. The bob loses height, so its potential energy falls, and it speeds up, so its kinetic energy rises."],
    ["both increase", "The bob falls, so it loses potential energy. Energy changes form, so it cannot be gained in both."],
    ["both stay", "The bob changes height and speed as it swings down, so both forms of energy change."],
  ],
  63: [
    ["negative", "Work is only done when the force has a component along the motion. Gravity here is always at right angles to the satellite's path, so the work is not negative."],
    ["positive", "Gravity is at right angles to the satellite's motion, so it does not speed the satellite up or slow it down."],
    ["equal to", "The satellite's kinetic energy stays constant because gravity does no work on it."],
  ],
  64: [
    ["neither", "In an elastic collision both momentum and kinetic energy are conserved."],
    ["only kinetic", "Momentum is conserved in every isolated collision, so it is also conserved here."],
    ["only momentum", "That describes an inelastic collision. In an elastic collision the total kinetic energy is also conserved."],
  ],
  65: [
    ["a collision with no", "Momentum is transferred between the objects in any collision. Sticking together is the case where the most kinetic energy is lost."],
    ["a perfectly elastic", "In an elastic collision the objects bounce apart and no kinetic energy is lost. Objects that stick together lose as much as possible."],
    ["a collision that conserves", "Kinetic energy is lost when objects stick together, to heat, sound and deformation, so it is not conserved."],
  ],
  66: [
    ["decreasing the passenger's", "An airbag does not change the passenger's mass. It changes how long the stopping takes."],
    ["increasing the force", "An airbag lowers the force on the passenger by spreading the stopping over more time."],
    ["decreasing the time", "A shorter time would raise the force. The airbag makes the stopping take longer."],
  ],
  67: [
    ["moving at double", "Their momenta point in opposite directions, so they cancel instead of adding. Nothing makes the trolleys speed up."],
    ["moving faster", "Momentum is conserved, and the total before was zero. The trolleys cannot gain speed from that."],
    ["moving at half", "The total momentum before the collision is zero, so the combined trolleys have no momentum and no speed."],
  ],
  68: [
    ["increases the momentum", "The ball's momentum is not increased. Moving the hands back changes how long the ball takes to stop."],
    ["decreases the time", "Moving the hands back makes the contact last longer, not shorter, which lowers the force."],
    ["has no effect", "Lengthening the contact time reduces the force on the hands for the same change in momentum."],
  ],
  69: [
    ["Period and frequency", "Period is a time and frequency counts waves per second, so neither is a distance. Wavelength is the distance."],
    ["All four", "Wavelength and amplitude are distances, so they are measured in metres, not units of time."],
    ["Amplitude and period", "Period is a time, not a distance, and wavelength is a distance, not a time."],
  ],
  70: [
    ["neither", "A wave exists to transfer energy. Sound and light both carry energy."],
    ["matter from", "A wave moves energy, not matter. The particles of the medium oscillate in place instead of travelling with the wave."],
    ["both matter", "The medium does not travel with the wave, so no matter is transferred, only energy."],
  ],
  71: [
    ["twice the wavelength", "Amplitude and wavelength are separate properties. Wave A has the same frequency, so the amplitude does not change its wavelength."],
    ["the same energy", "The energy a wave carries depends on its amplitude, so a larger amplitude means more energy."],
    ["less energy", "More amplitude means more energy. Wave A has the larger amplitude, so it carries more."],
  ],
  72: [
    ["A wave travelling along a plucked", "The string moves up and down across the wave's direction of travel, so this is a transverse wave."],
    ["A light wave", "Light is a transverse electromagnetic wave. Its fields oscillate at right angles to the direction it travels."],
    ["A ripple", "Water surface ripples are mostly transverse, with the surface moving up and down as the ripple spreads sideways."],
  ],
  73: [
    ["Only the wave's amplitude", "Entering a new medium changes the speed, and because v = fλ, the wavelength changes with it."],
    ["None", "The wave's speed changes in a different medium, and with the frequency fixed, the wavelength must change too."],
    ["Only the wave's frequency", "The frequency is set by the source and does not change when the wave enters a new medium."],
  ],
  74: [
    ["speed of the wave", "The speed of a wave depends on its medium. The Doppler effect changes the observed frequency, not the speed."],
    ["direction of the wave", "The Doppler effect is about a change in frequency and wavelength caused by relative motion."],
    ["amplitude of a wave", "How the amplitude changes with distance is a separate effect. The Doppler effect is a shift in frequency from relative motion."],
  ],
  75: [
    ["Red", "Red is at the long-wavelength end of the visible spectrum, not the short end."],
    ["Green", "Green is in the middle of the visible spectrum. Violet has the shortest wavelength."],
    ["Orange", "Orange is toward the long-wavelength end, next to red. Violet has the shortest wavelength."],
  ],
  76: [
    ["exactly the same", "X-rays are a different part of the electromagnetic spectrum, with a much shorter wavelength than visible light."],
    ["no defined", "Every electromagnetic wave, X-rays included, has a wavelength and a frequency. X-rays have a very short wavelength."],
    ["a longer wavelength", "These are the wrong way round. X-rays sit beyond ultraviolet, so they have a shorter wavelength and a higher frequency than visible light."],
  ],
  77: [
    ["slows down", "Light speeds up when it goes from glass into air, because air is less dense optically, so it bends away from the normal."],
    ["does not change", "Light changes speed and direction when it crosses the boundary at an angle, so the ray bends."],
    ["speeds up and bends toward", "Light does speed up in air, but speeding up makes it bend away from the normal, not toward it."],
  ],
  78: [
    ["the light travels perpendicular", "Light travelling along the normal passes straight through. The critical angle is a particular angle of incidence where the refracted ray runs along the boundary."],
    ["the light is completely", "The critical angle is about refraction and reflection, not absorption. Beyond it, the light is reflected back into the glass."],
    ["the light ray reverses", "Reversing along its own path would mean hitting the boundary at right angles and bouncing straight back. At the critical angle the refracted ray travels along the boundary."],
  ],
  79: [
    ["Light can be focused", "A lens focuses light by refraction, which a ray model can also explain. It does not show wave behaviour."],
    ["Light travels in straight", "Straight-line travel fits the ray model of light. It does not need waves."],
    ["Light reflects", "Reflection can be explained by rays or by waves, so it does not show that light is a wave. Diffraction does."],
  ],
  80: [
    ["destructive", "Destructive interference needs a crest to meet a trough. When crests meet crests the displacements add together."],
    ["diffraction", "Diffraction is a wave spreading around an obstacle or through a gap. Two waves adding is interference."],
    ["refraction", "Refraction is a wave changing direction in a new medium. Two waves adding together is interference."],
  ],
  81: [
    ["a wave travelling through a vacuum", "A standing wave on a string needs a string to travel along. The key condition is two waves going in opposite directions."],
    ["two waves of very", "A standing wave needs two waves of the same frequency. Very different frequencies do not make fixed nodes and antinodes."],
    ["a single wave", "A single wave travelling one way just moves along. A standing wave needs it to meet a wave going the other way, such as its reflection."],
  ],
  82: [
    ["direction of travel", "Which way a sound wave travels does not change how high or low it sounds."],
    ["amplitude", "Amplitude decides how loud the sound is. Pitch depends on the frequency."],
    ["speed in air", "The speed of sound in air stays about the same for all notes. The pitch depends on the frequency."],
  ],
  83: [
    ["no relationship", "Speed, frequency and wavelength are linked by v = fλ. With speed fixed, a different frequency means a different wavelength."],
    ["the same wavelength", "The same wavelength at the same speed would mean the same frequency. These stations have different frequencies."],
    ["different speeds", "The question says the waves travel at the same speed. The difference between the stations shows up in the wavelength."],
  ],
  84: [
    ["exactly the same as visible", "Microwaves are in a different part of the electromagnetic spectrum, with a much longer wavelength than visible light."],
    ["shorter than visible", "Microwaves have a longer wavelength than visible light. Shorter wavelengths are ultraviolet, X-rays and gamma rays."],
    ["longer than all radio", "Radio waves include the longest wavelengths in the spectrum. Microwaves are shorter than most of them."],
  ],
  85: [
    ["gains electrons", "Gaining electrons gives an object an excess of negative charge. To become positive it must lose them."],
    ["creates new", "Charge is not created. An object becomes positive because electrons move away from it."],
    ["gains protons", "Protons are held in the nucleus and do not move when objects are charged. Losing electrons is what leaves an object positive."],
  ],
  86: [
    ["requires the two", "That describes conduction. Induction works with a charged object nearby but not touching."],
    ["transfers no", "Induction does leave the object charged. Charge moves within the object, and it can then be left with a net charge, for example by earthing it."],
    ["only works", "Induction works best with conductors, where charge can move freely. It does not need two insulators."],
  ],
  87: [
    ["electric current always", "A field can exist with no current. Any charge in the region feels a force, whether or not anything is flowing."],
    ["only positive", "Both positive and negative charges can exist in an electric field. A field is defined by the force it exerts on a charge."],
    ["magnetic effects", "Electric fields and magnetic fields are separate. An electric field is defined by the force on a charge."],
  ],
  88: [
    ["a small negative", "A negative test charge feels a force opposite to the field. The direction of the field is defined using a positive test charge."],
    ["any charge", "Positive and negative charges feel forces in opposite directions, so the definition has to name one. It uses a positive test charge."],
    ["the nearest free", "Field direction is defined using a small positive test charge, not an electron."],
  ],
  89: [
    ["neutralise", "Like charges push apart. They only neutralise if opposite charges are brought together and cancel."],
    ["exert no force", "Charges exert forces on each other at a distance, and like charges push apart."],
    ["attract", "Opposite charges attract. Like charges, both positive or both negative, repel."],
  ],
  90: [
    ["stays the same", "The force is proportional to each charge, so changing one of them changes the force."],
    ["halves", "A larger charge gives a larger force. Doubling a charge doubles the force."],
    ["quadruples", "The force is proportional to each charge, so doubling one doubles it. It would quadruple if the distance were halved."],
  ],
  91: [
    ["zero at the centre", "The field is uniform between the plates, so it is the same in the centre as anywhere else."],
    ["always directed along", "The field and force are across the gap, from the positive plate toward the negative plate, not along the plates."],
    ["strongest only", "The field between the plates has the same strength at every point, so the force does not depend on where the charge is."],
  ],
  92: [
    ["the metal's positive ions", "The positive ions are fixed in the lattice. It is the free electrons that move."],
    ["positive 'holes'", "Holes matter in semiconductors. In a metal, current is carried by free electrons."],
    ["protons moving", "Protons are in the nuclei and stay put in the solid metal. Free electrons carry the current."],
  ],
  93: [
    ["Increasing its temperature", "Heating a metal makes its atoms vibrate more, which gets in the way of the electrons, so the resistance goes up."],
    ["Using a less", "A material that conducts less well has a higher resistance, not lower."],
    ["Increasing its length", "A longer wire gives the electrons a longer path through the lattice, so the resistance rises."],
  ],
  94: [
    ["is always exactly", "A filament's resistance changes as it heats up, so its current is not proportional to the voltage."],
    ["is a straight line", "A straight line through the origin means a constant resistance, which describes an ohmic conductor. A filament's resistance changes."],
    ["does not exist", "A non-ohmic device still has a relationship between voltage and current. It is just not a straight line."],
  ],
  95: [
    ["be completely unaffected", "In a series loop there is a single path for the current. A break anywhere stops it for all the globes."],
    ["become brighter", "With the loop broken no current flows, so the other globes get no power and go out."],
    ["stay lit", "Staying lit would need a second path for current, as in a parallel circuit. In series, one break stops all of them."],
  ],
  96: [
    ["become dimmer", "Each parallel branch is across the full supply voltage, so removing one branch does not change how bright the others are."],
    ["also stop", "That is what happens in a series circuit. Parallel branches have their own complete paths."],
    ["carry no current", "The other branches are still connected across the supply, so they carry current as before."],
  ],
  97: [
    ["become the average", "Resistors in series add up. The total is larger than any single resistor, not an average."],
    ["stay exactly", "Each resistor in series gives the current more to push through, so the total resistance rises."],
    ["decrease", "Adding resistors in parallel lowers the total resistance. In series it goes up."],
  ],
  98: [
    ["resistance is irrelevant", "Resistance matters a lot. If an ammeter had a high resistance it would change the current it is trying to measure."],
    ["high resistance would", "High resistance would not make an ammeter read voltage. It would reduce the current in the circuit and give a wrong reading."],
    ["it is connected in parallel", "An ammeter is connected in series. It has low resistance so it does not change the current."],
  ],
  99: [
    ["removing any iron", "A soft iron core strengthens the field a lot, so taking one out weakens it."],
    ["reducing the number", "Fewer turns of wire give a weaker field. More turns make it stronger."],
    ["decreasing the current", "A smaller current gives a weaker field. Increasing the current makes it stronger."],
  ],
  100: [
    ["not be affected", "A current produces a magnetic field around the wire, and a compass needle responds to magnetic fields."],
    ["only be affected", "A compass reacts to any magnetic field, including the one around a current-carrying wire."],
    ["always point directly", "The field circles the wire, so the needle lines up along the circle, not toward the wire."],
  ],
};
