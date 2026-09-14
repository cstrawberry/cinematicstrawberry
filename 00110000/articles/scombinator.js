/* Educational views of the rule and cited examples. No universal execution is performed here. */
(() => {
    'use strict';
    const before = document.getElementById('rule-before');
    const after = document.getElementById('rule-after');
    const edges = document.getElementById('rule-edges');
    const nodes = document.getElementById('rule-nodes');
    const initialEdges = edges.innerHTML;
    const initialNodes = nodes.innerHTML;
    function showRule(rewritten) {
        before.setAttribute('aria-pressed', String(!rewritten));
        after.setAttribute('aria-pressed', String(rewritten));
        edges.innerHTML = rewritten ? '<path d="M320 40 L170 125 M320 40 L470 125 M170 125 L80 225 M170 125 L240 225 M470 125 L400 225 M470 125 L560 225"/>' : initialEdges;
        nodes.innerHTML = rewritten ? '<text x="320" y="40">@</text><text x="170" y="125">@</text><text x="470" y="125">@</text><text x="80" y="225">X</text><text x="400" y="225">Y</text><g class="z-node"><circle cx="240" cy="225" r="24"/><text x="240" y="225">Z</text></g><g class="z-node"><circle cx="560" cy="225" r="24"/><text x="560" y="225">Z</text></g>' : initialNodes;
        document.getElementById('rule-svg-title').textContent = `The application tree ${rewritten ? 'after' : 'before'} an S rewrite`;
        document.getElementById('rule-status').textContent = rewritten
            ? 'After: X receives Z, Y receives a second occurrence of Z, and the two results are joined: (X Z)(Y Z).'
            : 'Before: one occurrence of Z. Each @ joins a left expression to a right expression.';
    }
    before.addEventListener('click', () => showRule(false));
    after.addEventListener('click', () => showRule(true));

    const checkpoints = [
        {queue: '101', phase: 0, note: 'The queue starts at 101. At phase 0, a leading 1 appends the string 1.'},
        {queue: '011', phase: 1, note: 'Consume the leading 1 and append 1: 101 becomes 011. The S encoding reaches this checkpoint after 22 rewrites.'},
        {queue: '11', phase: 0, note: 'Consume the leading 0 and append nothing: 011 becomes 11. The S encoding reaches this checkpoint after 85 rewrites in total.'}
    ];
    document.querySelectorAll('[data-queue-step]').forEach(button => {
        button.addEventListener('click', () => {
            const step = Number(button.dataset.queueStep);
            const current = checkpoints[step];
            document.querySelectorAll('[data-queue-step]').forEach(item => item.setAttribute('aria-pressed', String(item === button)));
            const bits = document.getElementById('queue-bits');
            bits.replaceChildren(...Array.from(current.queue, (bit, index) => {
                const node = document.createElement('span');
                node.className = `bit${index === 0 ? ' front-bit' : ''}`;
                node.textContent = bit;
                return node;
            }));
            document.getElementById('queue-phase').textContent = `Next phase: ${current.phase}`;
            document.getElementById('queue-display').setAttribute('aria-label', `Queue after ${step} steps: ${current.queue.split('').join(', ')}. Next phase: ${current.phase}.`);
            document.getElementById('queue-status').textContent = current.note;
            document.querySelectorAll('[data-trace-row]').forEach(row => row.classList.toggle('selected-row', Number(row.dataset.traceRow) === step));
        });
    });

    document.querySelectorAll('[data-memory-bits]').forEach(button => {
        button.addEventListener('click', () => {
            const bits = Number(button.dataset.memoryBits);
            document.querySelectorAll('[data-memory-bits]').forEach(item => item.setAttribute('aria-pressed', String(item === button)));
            document.querySelectorAll('[data-membership]').forEach(cell => {
                cell.querySelector('.message-code').textContent = cell.dataset.membership.slice(0, bits);
            });
            document.getElementById('memory-status').textContent = bits === 1
                ? "One bit keeps choice 0's membership exactly. Choice 1 remains equally likely to be present or absent: one bit of residual uncertainty, with 25% mean error across the two membership questions."
                : 'Two bits give four distinct messages. Every prepared record is identified exactly: zero residual uncertainty and zero reconstruction error.';
        });
    });
    document.querySelectorAll('[data-interactive]').forEach(controls => { controls.hidden = false; });
})();
