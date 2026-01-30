const fs = require('fs');
const content = fs.readFileSync('public/index.html', 'utf8');
// Split by \r\n or \n to handle line endings
const lines = content.split(/\r?\n/);

// Log lines to verify we are targeting correctly
console.log('Original Line 371:', lines[370]);
console.log('Original Line 448:', lines[447]);

const newLines = [];
// Keep lines 1 to 367 (indices 0 to 366)
for (let i = 0; i < 367; i++) {
    newLines.push(lines[i]);
}

// Fix Line 368 (Index 367). Original was: ...Requerido para
newLines.push('                        <small style="color: var(--text-muted); font-size: 0.8rem;" id="password-hint">Requerido para nuevos usuarios</small>');

// Line 369 (Index 368) was </div>. Keep it.
newLines.push('                    </div>');

// Insert Button and Closing Tags
newLines.push('                    <div style="text-align: right; margin-top: 1rem;">');
newLines.push('                        <button type="submit" class="action-btn">Guardar Usuario</button>');
newLines.push('                    </div>');
newLines.push('                </form>');
newLines.push('            </div>');
newLines.push('        </div>');

// Skip Duplicate Modal
// Resume at Line 448 (Index 447).
// This skips lines 370 to 447 (indices 369 to 446) - wait.
// Index 369 (Line 370) was blank.
// Index 370 (Line 371) was <!-- User Modal ... -->.
// Index 446 (Line 447) was blank?
// Index 447 (Line 448) is <!-- Password Change Modal -->.
// So we want to resume at Index 447.

for (let i = 447; i < lines.length; i++) {
    newLines.push(lines[i]);
}

fs.writeFileSync('public/index.html', newLines.join('\n'));
console.log('Fixed index.html successfully');
