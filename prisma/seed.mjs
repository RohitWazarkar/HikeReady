// -----------------------------------------------------------------------------
// HikeReady seed script (JSON-data-layer edition).
//
// We are not using Prisma yet, so this seeds the JSON "database" via lib/db.js
// instead of prisma/seed.ts. When we migrate to Prisma later, this file becomes
// prisma/seed.ts and swaps `db.*` calls for `prisma.*` calls; the data below
// stays the same.
//
// Inserts:
//   - 3 categories (DSA, DBMS, JavaScript)
//   - 2 topics per category (6 topics)
//   - 3 questions per topic (18 questions) with realistic Markdown
//     (each includes a fenced code block; several include a Markdown table)
//   - Mixed difficulties, a few isPremium, all status = "Published"
//
// It is idempotent: it empties every collection first, so running it repeatedly
// gives the same result (ids will differ since they are generated).
//
// Run:  npm run seed
// -----------------------------------------------------------------------------

import { promises as fs } from "fs";
import path from "path";
import { db, models } from "../lib/db.js";

// --- Idempotent reset: empty every collection before seeding ----------------
async function resetAll() {
  const dataDir = path.join(process.cwd(), "data");
  await fs.mkdir(dataDir, { recursive: true });
  for (const spec of Object.values(models)) {
    await fs.writeFile(path.join(dataDir, spec.file), "[]\n", "utf8");
  }
}

// A slug helper so slugs are consistent and unique-friendly.
const slugify = (s) =>
  s
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

// -----------------------------------------------------------------------------
// Seed content. Structured as categories -> topics -> questions so we can loop
// and create the relations (categoryId, topicId) as we go.
// -----------------------------------------------------------------------------
const SEED = [
  {
    category: { name: "DSA", description: "Data Structures & Algorithms" },
    topics: [
      {
        name: "Arrays",
        questions: [
          {
            title: "Two Sum",
            difficulty: "Easy",
            isPremium: false,
            tags: ["array", "hash-map"],
            bodyMd: [
              "Given an array of integers `nums` and an integer `target`, return the **indices** of the two numbers that add up to `target`.",
              "",
              "You may assume each input has **exactly one** solution, and you may not use the same element twice.",
              "",
              "**Example**",
              "",
              "| Input | target | Output |",
              "| ----- | ------ | ------ |",
              "| `[2,7,11,15]` | `9` | `[0,1]` |",
              "| `[3,2,4]` | `6` | `[1,2]` |",
            ].join("\n"),
            answerMd: [
              "Use a hash map from value to index. For each number, check if its complement (`target - num`) was seen.",
              "",
              "```js",
              "function twoSum(nums, target) {",
              "  const seen = new Map();",
              "  for (let i = 0; i < nums.length; i++) {",
              "    const need = target - nums[i];",
              "    if (seen.has(need)) return [seen.get(need), i];",
              "    seen.set(nums[i], i);",
              "  }",
              "  return [];",
              "}",
              "```",
              "",
              "**Complexity:** time `O(n)`, space `O(n)`.",
            ].join("\n"),
          },
          {
            title: "Maximum Subarray (Kadane's Algorithm)",
            difficulty: "Medium",
            isPremium: false,
            tags: ["array", "dynamic-programming"],
            bodyMd: [
              "Find the contiguous subarray with the largest sum and return that sum.",
              "",
              "> Example: for `[-2,1,-3,4,-1,2,1,-5,4]` the answer is `6` (`[4,-1,2,1]`).",
            ].join("\n"),
            answerMd: [
              "Track the best sum ending at the current index and the global best.",
              "",
              "```js",
              "function maxSubArray(nums) {",
              "  let best = nums[0];",
              "  let cur = nums[0];",
              "  for (let i = 1; i < nums.length; i++) {",
              "    cur = Math.max(nums[i], cur + nums[i]);",
              "    best = Math.max(best, cur);",
              "  }",
              "  return best;",
              "}",
              "```",
            ].join("\n"),
          },
          {
            title: "Trapping Rain Water",
            difficulty: "Hard",
            isPremium: true,
            tags: ["array", "two-pointers"],
            bodyMd: [
              "Given `n` non-negative integers representing an elevation map where the width of each bar is `1`, compute how much water it can trap after raining.",
              "",
              "**Example**",
              "",
              "| Heights | Trapped |",
              "| ------- | ------- |",
              "| `[0,1,0,2,1,0,1,3,2,1,2,1]` | `6` |",
            ].join("\n"),
            answerMd: [
              "Two-pointer approach using running left/right maxima.",
              "",
              "```js",
              "function trap(height) {",
              "  let l = 0, r = height.length - 1;",
              "  let lMax = 0, rMax = 0, water = 0;",
              "  while (l < r) {",
              "    if (height[l] < height[r]) {",
              "      lMax = Math.max(lMax, height[l]);",
              "      water += lMax - height[l++];",
              "    } else {",
              "      rMax = Math.max(rMax, height[r]);",
              "      water += rMax - height[r--];",
              "    }",
              "  }",
              "  return water;",
              "}",
              "```",
              "",
              "**Complexity:** time `O(n)`, space `O(1)`.",
            ].join("\n"),
          },
        ],
      },
      {
        name: "Linked Lists",
        questions: [
          {
            title: "Reverse a Linked List",
            difficulty: "Easy",
            isPremium: false,
            tags: ["linked-list", "pointers"],
            bodyMd: [
              "Reverse a singly linked list and return the new head.",
              "",
              "Input: `1 -> 2 -> 3 -> null`  \u2192  Output: `3 -> 2 -> 1 -> null`",
            ].join("\n"),
            answerMd: [
              "Iteratively flip each `next` pointer.",
              "",
              "```js",
              "function reverseList(head) {",
              "  let prev = null;",
              "  while (head) {",
              "    const next = head.next;",
              "    head.next = prev;",
              "    prev = head;",
              "    head = next;",
              "  }",
              "  return prev;",
              "}",
              "```",
            ].join("\n"),
          },
          {
            title: "Detect a Cycle in a Linked List",
            difficulty: "Medium",
            isPremium: false,
            tags: ["linked-list", "two-pointers"],
            bodyMd: [
              "Return `true` if the linked list has a cycle, otherwise `false`.",
              "",
              "Use **Floyd's tortoise and hare** to do it in `O(1)` space.",
            ].join("\n"),
            answerMd: [
              "```js",
              "function hasCycle(head) {",
              "  let slow = head, fast = head;",
              "  while (fast && fast.next) {",
              "    slow = slow.next;",
              "    fast = fast.next.next;",
              "    if (slow === fast) return true;",
              "  }",
              "  return false;",
              "}",
              "```",
            ].join("\n"),
          },
          {
            title: "Merge k Sorted Lists",
            difficulty: "Hard",
            isPremium: true,
            tags: ["linked-list", "heap", "divide-and-conquer"],
            bodyMd: [
              "Merge `k` sorted linked lists into one sorted list.",
              "",
              "| Approach | Time | Space |",
              "| -------- | ---- | ----- |",
              "| Min-heap | `O(N log k)` | `O(k)` |",
              "| Pairwise merge | `O(N log k)` | `O(1)` |",
            ].join("\n"),
            answerMd: [
              "Pairwise merge halves the number of lists each round.",
              "",
              "```js",
              "function mergeTwo(a, b) {",
              "  const dummy = { next: null };",
              "  let tail = dummy;",
              "  while (a && b) {",
              "    if (a.val <= b.val) { tail.next = a; a = a.next; }",
              "    else { tail.next = b; b = b.next; }",
              "    tail = tail.next;",
              "  }",
              "  tail.next = a || b;",
              "  return dummy.next;",
              "}",
              "```",
            ].join("\n"),
          },
        ],
      },
    ],
  },
  {
    category: { name: "DBMS", description: "Database Management Systems" },
    topics: [
      {
        name: "SQL Queries",
        questions: [
          {
            title: "Second Highest Salary",
            difficulty: "Easy",
            isPremium: false,
            tags: ["sql", "aggregation"],
            bodyMd: [
              "Given an `Employee` table, write a query to find the **second highest** salary.",
              "",
              "| id | salary |",
              "| -- | ------ |",
              "| 1  | 100    |",
              "| 2  | 200    |",
              "| 3  | 300    |",
              "",
              "Expected output: `200`.",
            ].join("\n"),
            answerMd: [
              "```sql",
              "SELECT MAX(salary) AS SecondHighestSalary",
              "FROM Employee",
              "WHERE salary < (SELECT MAX(salary) FROM Employee);",
              "```",
            ].join("\n"),
          },
          {
            title: "Rank Scores with Window Functions",
            difficulty: "Medium",
            isPremium: false,
            tags: ["sql", "window-functions"],
            bodyMd: [
              "Rank each score so that ties share a rank and there are **no gaps** between ranks.",
            ].join("\n"),
            answerMd: [
              "Use `DENSE_RANK()`.",
              "",
              "```sql",
              "SELECT score,",
              "       DENSE_RANK() OVER (ORDER BY score DESC) AS rank",
              "FROM Scores;",
              "```",
            ].join("\n"),
          },
          {
            title: "Department Top Three Salaries",
            difficulty: "Hard",
            isPremium: true,
            tags: ["sql", "window-functions", "joins"],
            bodyMd: [
              "For each department, report employees who are among the **top three** unique salaries.",
            ].join("\n"),
            answerMd: [
              "```sql",
              "SELECT d.name AS department, e.name AS employee, e.salary",
              "FROM (",
              "  SELECT *,",
              "         DENSE_RANK() OVER (PARTITION BY departmentId ORDER BY salary DESC) AS rnk",
              "  FROM Employee",
              ") e",
              "JOIN Department d ON d.id = e.departmentId",
              "WHERE e.rnk <= 3;",
              "```",
            ].join("\n"),
          },
        ],
      },
      {
        name: "Indexing",
        questions: [
          {
            title: "What is a Database Index?",
            difficulty: "Easy",
            isPremium: false,
            tags: ["indexing", "performance"],
            bodyMd: [
              "Explain what an index is and the main trade-off it introduces.",
              "",
              "| Operation | Without index | With index |",
              "| --------- | ------------- | ---------- |",
              "| Read (lookup) | Slower (scan) | Faster |",
              "| Write (insert/update) | Faster | Slower (index upkeep) |",
            ].join("\n"),
            answerMd: [
              "An index is an auxiliary data structure (often a **B-tree**) that speeds up lookups at the cost of extra storage and slower writes, because the index must be maintained.",
            ].join("\n"),
          },
          {
            title: "Clustered vs Non-Clustered Index",
            difficulty: "Medium",
            isPremium: false,
            tags: ["indexing", "b-tree"],
            bodyMd: [
              "Compare clustered and non-clustered indexes.",
            ].join("\n"),
            answerMd: [
              "| | Clustered | Non-clustered |",
              "| - | --------- | ------------- |",
              "| Row order | Table stored in index order | Separate structure |",
              "| Count | One per table | Many per table |",
              "| Leaf holds | Actual row | Pointer to row |",
            ].join("\n"),
          },
          {
            title: "Design Indexes for a Slow Query",
            difficulty: "Hard",
            isPremium: false,
            tags: ["indexing", "query-optimization"],
            bodyMd: [
              "Given a slow query filtering on `status` and sorting by `created_at`, propose an index.",
              "",
              "```sql",
              "SELECT * FROM orders",
              "WHERE status = 'PAID'",
              "ORDER BY created_at DESC",
              "LIMIT 20;",
              "```",
            ].join("\n"),
            answerMd: [
              "A **composite index** matching the filter then the sort works best.",
              "",
              "```sql",
              "CREATE INDEX idx_orders_status_created",
              "  ON orders (status, created_at DESC);",
              "```",
            ].join("\n"),
          },
        ],
      },
    ],
  },
  {
    category: { name: "JavaScript", description: "JavaScript language & runtime" },
    topics: [
      {
        name: "Closures",
        questions: [
          {
            title: "What is a Closure?",
            difficulty: "Easy",
            isPremium: false,
            tags: ["closures", "scope"],
            bodyMd: [
              "Explain closures with a small example.",
            ].join("\n"),
            answerMd: [
              "A closure is a function that remembers variables from the scope where it was created.",
              "",
              "```js",
              "function counter() {",
              "  let count = 0;",
              "  return () => ++count;",
              "}",
              "const next = counter();",
              "next(); // 1",
              "next(); // 2",
              "```",
            ].join("\n"),
          },
          {
            title: "Fix the Loop Variable Capture Bug",
            difficulty: "Medium",
            isPremium: false,
            tags: ["closures", "var-let"],
            bodyMd: [
              "Why does this log `3, 3, 3` and how do you fix it?",
              "",
              "```js",
              "for (var i = 0; i < 3; i++) {",
              "  setTimeout(() => console.log(i), 0);",
              "}",
              "```",
            ].join("\n"),
            answerMd: [
              "`var` is function-scoped, so all callbacks share one `i`. Use `let` (block-scoped) instead.",
              "",
              "```js",
              "for (let i = 0; i < 3; i++) {",
              "  setTimeout(() => console.log(i), 0); // 0, 1, 2",
              "}",
              "```",
            ].join("\n"),
          },
          {
            title: "Implement a Memoize Function",
            difficulty: "Hard",
            isPremium: true,
            tags: ["closures", "higher-order-functions"],
            bodyMd: [
              "Write a `memoize(fn)` that caches results by arguments.",
            ].join("\n"),
            answerMd: [
              "```js",
              "function memoize(fn) {",
              "  const cache = new Map();",
              "  return function (...args) {",
              "    const key = JSON.stringify(args);",
              "    if (cache.has(key)) return cache.get(key);",
              "    const result = fn.apply(this, args);",
              "    cache.set(key, result);",
              "    return result;",
              "  };",
              "}",
              "```",
            ].join("\n"),
          },
        ],
      },
      {
        name: "Async & Promises",
        questions: [
          {
            title: "Promise vs Callback",
            difficulty: "Easy",
            isPremium: false,
            tags: ["promises", "async"],
            bodyMd: [
              "Summarize why Promises are preferred over nested callbacks.",
            ].join("\n"),
            answerMd: [
              "Promises flatten nesting (no *callback hell*), standardize error handling via `.catch`, and compose with `async/await`.",
              "",
              "```js",
              "const data = await fetch(url).then((r) => r.json());",
              "```",
            ].join("\n"),
          },
          {
            title: "Run Promises in Parallel vs Series",
            difficulty: "Medium",
            isPremium: false,
            tags: ["promises", "concurrency"],
            bodyMd: [
              "Show the difference between running async tasks in series and in parallel.",
              "",
              "| Strategy | Total time (3 x 1s tasks) |",
              "| -------- | ------------------------- |",
              "| Series (`await` each) | ~3s |",
              "| Parallel (`Promise.all`) | ~1s |",
            ].join("\n"),
            answerMd: [
              "```js",
              "// Parallel: kick off all, then await together",
              "const [a, b, c] = await Promise.all([taskA(), taskB(), taskC()]);",
              "```",
            ].join("\n"),
          },
          {
            title: "Implement Promise.all from Scratch",
            difficulty: "Hard",
            isPremium: false,
            tags: ["promises", "internals"],
            bodyMd: [
              "Implement your own `promiseAll(promises)` that resolves with an array of results or rejects on the first error.",
            ].join("\n"),
            answerMd: [
              "```js",
              "function promiseAll(promises) {",
              "  return new Promise((resolve, reject) => {",
              "    const results = [];",
              "    let remaining = promises.length;",
              "    if (remaining === 0) return resolve(results);",
              "    promises.forEach((p, i) => {",
              "      Promise.resolve(p).then((val) => {",
              "        results[i] = val;",
              "        if (--remaining === 0) resolve(results);",
              "      }, reject);",
              "    });",
              "  });",
              "}",
              "```",
            ].join("\n"),
          },
        ],
      },
    ],
  },
];

async function main() {
  console.log("Resetting collections...");
  await resetAll();

  let catCount = 0;
  let topicCount = 0;
  let questionCount = 0;

  for (const entry of SEED) {
    const category = await db.categories.create({
      name: entry.category.name,
      slug: slugify(entry.category.name),
      description: entry.category.description,
    });
    catCount++;

    for (const t of entry.topics) {
      const topic = await db.topics.create({
        categoryId: category.id,
        name: t.name,
        slug: slugify(`${entry.category.name}-${t.name}`),
      });
      topicCount++;

      for (const q of t.questions) {
        await db.questions.create({
          topicId: topic.id,
          title: q.title,
          slug: slugify(q.title),
          bodyMd: q.bodyMd,
          answerMd: q.answerMd,
          difficulty: q.difficulty,
          tags: q.tags,
          isPremium: q.isPremium,
          status: "Published",
        });
        questionCount++;
      }
    }
  }

  console.log("Seed complete:");
  console.log(`  categories: ${catCount}`);
  console.log(`  topics:     ${topicCount}`);
  console.log(`  questions:  ${questionCount}`);
}

main().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
