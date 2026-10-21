export const lessons = [
  {
    slug: "forex-basics",
    title: "Start with the currency pair",
    category: "Forex Fundamentals",
    minutes: 5,
    intro: "Understand a quote before studying a setup.",
    sections: [
      [
        "Two currencies, one price",
        "In EUR/USD, EUR is the base and USD is the quote. An illustrative price of 1.1000 means one euro is quoted at 1.10 US dollars. This example is not a live price.",
      ],
      [
        "Direction and uncertainty",
        "Buying a pair creates exposure to a rise in the base relative to the quote currency. Selling creates the opposite exposure. Either position can lose value.",
      ],
      [
        "Practice task",
        "In a demo environment, identify the base, quote, bid and ask for one pair. Write down what would make a hypothetical long position gain or lose value. No real-money trade is needed.",
      ],
    ],
    question: "Which is the base currency in EUR/USD?",
    answers: ["EUR", "USD", "Both equally"],
    correct: 0,
    explanation: "The first currency, EUR, is the base.",
  },
  {
    slug: "pips-and-spreads",
    title: "Pips, spreads and trading costs",
    category: "Forex Fundamentals",
    minutes: 6,
    intro: "Separate price movement from entry costs.",
    sections: [
      [
        "Measure movement",
        "For many pairs, one pip is 0.0001; for many JPY pairs, it is 0.01. Additional digits may represent fractional pips. Check the instrument specification.",
      ],
      [
        "Read the spread",
        "The difference between ask and bid is the spread. An illustrative EUR/USD bid of 1.1000 and ask of 1.1002 has a two-pip spread. Spreads can widen around news.",
      ],
      [
        "Record costs",
        "Distinguish spread, commission and overnight financing in your practice journal. Demo execution may differ from live execution.",
      ],
    ],
    question: "What is the spread from 1.1000 to 1.1002 at 0.0001 per pip?",
    answers: ["20 pips", "2 pips", "0.2 pips"],
    correct: 1,
    explanation: "0.0002 divided by 0.0001 is two pips.",
  },
  {
    slug: "leverage-and-margin",
    title: "Leverage means greater exposure",
    category: "Risk Management",
    minutes: 6,
    intro: "A small deposit can support a much larger position.",
    sections: [
      [
        "Exposure and margin",
        "At 10:1 leverage, 1,000 units of margin can support 10,000 units of exposure before other requirements. The full exposure drives gains and losses.",
      ],
      [
        "Losses matter",
        "A one-percent adverse move on 10,000 units is about 100 units before costs: ten percent of 1,000 units of margin. Margin and close-out rules vary by provider.",
      ],
      [
        "Practice first",
        "Explore size and margin in a demo account. Available leverage is not a target. Stops may execute at different prices during gaps or fast markets.",
      ],
    ],
    question: "What determines price-related gain or loss?",
    answers: [
      "Only the deposit",
      "The full position exposure",
      "The account theme",
    ],
    correct: 1,
    explanation: "Price movement acts on the full position.",
  },
  {
    slug: "reading-market-structure",
    title: "Read price in context",
    category: "Technical Analysis",
    minutes: 7,
    intro: "Observe consistently without treating patterns as predictions.",
    sections: [
      [
        "Choose a timeframe",
        "A candle represents open, high, low and close over an interval. A market can trend on one timeframe and move sideways on another.",
      ],
      [
        "Describe before deciding",
        "Identify recent swing highs and lows. Moving averages summarize past prices and lag changes. They do not establish certainty about the next move.",
      ],
      [
        "Reduce hindsight bias",
        "Save a chart before its outcome is known. Record an interpretation and what would invalidate it. Review losing examples as carefully as winners.",
      ],
    ],
    question: "What does a moving average summarize?",
    answers: ["Future prices", "Past prices", "A broker’s profit"],
    correct: 1,
    explanation: "It summarizes historical prices and can lag changes.",
  },
  {
    slug: "fundamental-analysis",
    title: "Economic releases and expectations",
    category: "Fundamental Analysis",
    minutes: 6,
    intro: "Context matters more than a single headline.",
    sections: [
      [
        "Watch expectations",
        "Interest-rate, inflation and employment releases can affect currencies. A release may matter because it differs from expectations.",
      ],
      [
        "Read the source",
        "Use the publishing central bank or statistical agency. Note release time, time zone, reference period and revisions. Commentary should not replace the original source.",
      ],
      [
        "Study without trading",
        "Record the consensus, result and subsequent price behavior for one release in a demo journal. News can widen spreads and cause slippage.",
      ],
    ],
    question: "Why can a positive headline produce a negative reaction?",
    answers: [
      "Expectations may have been higher",
      "Headlines guarantee direction",
      "Revisions never matter",
    ],
    correct: 0,
    explanation:
      "Markets can respond to differences between expectations and results.",
  },
  {
    slug: "risk-planning",
    title: "Define risk before a practice trade",
    category: "Risk Management",
    minutes: 7,
    intro: "A planned limit is not a promise about the outcome.",
    sections: [
      [
        "Define a loss budget",
        "One percent of an illustrative USD 10,000 demo account is USD 100. This is arithmetic, not a recommended risk percentage.",
      ],
      [
        "Connect size and distance",
        "Sizing must account for stop distance, pip value, currency conversion and costs. A wider stop with the same loss budget normally requires a smaller position.",
      ],
      [
        "Allow for uncertainty",
        "Stops are not guaranteed execution prices. Gaps, slippage and correlated positions can cause losses beyond a simple calculation. Review total exposure.",
      ],
    ],
    question: "With a fixed loss budget, a wider stop usually requires what?",
    answers: [
      "A larger position",
      "An unchanged position",
      "A smaller position",
    ],
    correct: 2,
    explanation:
      "Smaller size offsets greater potential loss per unit, before costs.",
  },
  {
    slug: "trading-psychology",
    title: "Make decisions you can review",
    category: "Trading Psychology",
    minutes: 5,
    intro: "Distinguish deliberate decisions from emotional reactions.",
    sections: [
      [
        "Name the trigger",
        "Fear of missing out, frustration after a loss and overconfidence after a gain can affect decisions. Naming a trigger makes it easier to record.",
      ],
      [
        "Use a checklist",
        "Before a demo trade, record the reason, invalidation point, risk and conditions. If it misses the criteria, record a decision to wait.",
      ],
      [
        "Review the process",
        "Profit can follow a poor decision; loss can follow a defined plan. Evaluate process separately from outcome. Take breaks when attention deteriorates.",
      ],
    ],
    question: "Which is a useful review question?",
    answers: [
      "Did I follow my criteria?",
      "Did every trade profit?",
      "Did I trade more today?",
    ],
    correct: 0,
    explanation:
      "Following documented criteria is observable despite uncertain outcomes.",
  },
  {
    slug: "trading-journal",
    title: "Build a journal that teaches you",
    category: "Trading Journals",
    minutes: 5,
    intro: "Turn screenshots into a learning record.",
    sections: [
      [
        "Before",
        "Record instrument, date, time zone, timeframe, hypothesis and invalidation. Add entry, stop, size and estimated costs for a demo exercise.",
      ],
      [
        "After",
        "Record the result, execution differences and whether the plan was followed. Include both winners and losers.",
      ],
      [
        "Reflect",
        "Group observations by setup and conditions. A small sample cannot prove a strategy works. Identify questions for further testing.",
      ],
    ],
    question: "Which examples belong in a journal?",
    answers: ["Only winners", "Only losses", "Both"],
    correct: 2,
    explanation: "Keeping both reduces selection bias.",
  },
];
export const catalogueMeta: Record<
  number,
  {
    slug: string;
    topic: string;
    level: string;
    format: string;
    duration: string;
    audience: string;
    prerequisite: string;
    lesson: string;
  }
> = {
  1: {
    slug: "why-they-call-me-prof",
    topic: "Forex Fundamentals",
    level: "Beginner",
    format: "Ebook",
    duration: "Publication details pending",
    audience: "Readers exploring the academy’s approach",
    prerequisite: "No prior knowledge",
    lesson: "forex-basics",
  },
  2: {
    slug: "the-5-minute-chart",
    topic: "Technical Analysis",
    level: "Intermediate",
    format: "Ebook",
    duration: "Publication details pending",
    audience: "Readers familiar with currency quotes",
    prerequisite: "Basic chart vocabulary",
    lesson: "reading-market-structure",
  },
  3: {
    slug: "trading-with-discipline",
    topic: "Trading Psychology",
    level: "Beginner",
    format: "Ebook",
    duration: "Publication details pending",
    audience: "Learners building a study routine",
    prerequisite: "No prior knowledge",
    lesson: "trading-psychology",
  },
  4: {
    slug: "forex-foundations",
    topic: "Forex Fundamentals",
    level: "Beginner",
    format: "Self-paced",
    duration: "3 sample lessons · about 17 min",
    audience: "People new to currency markets",
    prerequisite: "No prior knowledge",
    lesson: "forex-basics",
  },
  5: {
    slug: "the-aafxx-method",
    topic: "Technical Analysis",
    level: "Intermediate",
    format: "Self-paced",
    duration: "2 sample lessons · about 13 min",
    audience: "Learners studying chart context",
    prerequisite: "Currency pairs, pips and risk concepts",
    lesson: "reading-market-structure",
  },
  6: {
    slug: "risk-and-trade-management",
    topic: "Risk Management",
    level: "Advanced",
    format: "Self-paced",
    duration: "3 sample lessons · about 17 min",
    audience: "Learners reviewing exposure and decisions",
    prerequisite: "Chart reading and margin concepts",
    lesson: "risk-planning",
  },
};
