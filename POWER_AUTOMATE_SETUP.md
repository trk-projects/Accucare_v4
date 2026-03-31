# Accucare Website — Power Automate Setup Guide
### Send this guide to your client. All they need is an Office 365 Business account.

---

## Overview

You will complete two things:
1. **Create an Excel file** in OneDrive to store leads
2. **Build a Power Automate flow** that logs each lead to Excel and emails you

When done, you will copy one URL and send it to your web developer. That's it.

---

## Part 1 — Create the Excel Leads File

This must be done before building the flow.

**1.** Go to [onedrive.live.com](https://onedrive.live.com) and sign in with your Microsoft 365 account.

**2.** Click **+ New** → **Excel workbook**

**3.** Rename the file to `Accucare_Leads` (click the title at the top to rename it)

**4.** In the spreadsheet, click cell **A1** and type the following headers across the row — one per cell:

| A | B | C | D | E | F | G | H |
|---|---|---|---|---|---|---|---|
| Name | Facility | Email | Phone | Service | Message | Submitted At | Source Page |

**5.** Select all 8 header cells (A1 through H1)

**6.** In the top menu, click **Insert** → **Table**

- Make sure **"My table has headers"** is checked
- Click **OK**

**7.** The table will highlight blue. Click on the table, then look at the top ribbon — find the **Table Design** tab and change the **Table Name** from `Table1` to `Leads`

**8.** Save the file (Ctrl + S or Cmd + S)

Your Excel file is ready. Leave this tab open — you will need the file name later.

---

## Part 2 — Build the Power Automate Flow

**1.** Open a new browser tab and go to [make.powerautomate.com](https://make.powerautomate.com)

**2.** Sign in with the **same Microsoft 365 account** you used for OneDrive above

**3.** In the left sidebar, click **+ Create**

**4.** Click **Instant cloud flow**

**5.** In the "Build an instant cloud flow" dialog:
- Give it a name: `Accucare Lead Capture`
- Under "Choose how to trigger this flow" scroll down and select **"When a HTTP request is received"**
- Click **Create**

---

### Step A — Configure the HTTP Trigger

You will now be in the flow editor. You should see one step: **"When a HTTP request is received"**

**1.** Click on that step to expand it

**2.** Click the field labeled **"Request Body JSON Schema"**

**3.** Paste in the following text exactly as written:

```
{
  "type": "object",
  "properties": {
    "name":         { "type": "string" },
    "facility":     { "type": "string" },
    "email":        { "type": "string" },
    "phone":        { "type": "string" },
    "service":      { "type": "string" },
    "message":      { "type": "string" },
    "submitted_at": { "type": "string" },
    "source_page":  { "type": "string" }
  }
}
```

**4.** Leave everything else on this step as-is. Do not click Save yet.

---

### Step B — Add the Excel Row Action

**1.** Click the **+ New step** button below the HTTP trigger

**2.** In the search bar, type: `Add a row into a table`

**3.** Click the result that says **"Add a row into a table"** with the green Excel icon (it may say "Excel Online (Business)")

**4.** Fill in the fields:

- **Location**: Select `OneDrive for Business`
- **Document Library**: Select `OneDrive`
- **File**: Click the folder icon and navigate to your `Accucare_Leads.xlsx` file — select it
- **Table**: Select `Leads` from the dropdown

**5.** After selecting the table, new fields will appear for each column. Fill them in like this — for each field, click inside the box and select the matching blue "dynamic content" chip that appears:

| Field | Value to select |
|-------|----------------|
| Name | `name` |
| Facility | `facility` |
| Email | `email` |
| Phone | `phone` |
| Service | `service` |
| Message | `message` |
| Submitted At | `submitted_at` |
| Source Page | `source_page` |

> **Tip:** When you click inside a column field, a panel called "Dynamic content" will pop up on the right side. Click the matching item from the list. If you don't see all options, click "See more."

---

### Step C — Add the Outlook Email Action

**1.** Click **+ New step** again

**2.** In the search bar, type: `Send an email`

**3.** Select **"Send an email (V2)"** with the Outlook icon

**4.** Fill in the fields:

**To:**
```
[your own email address here]
```

**Subject:**
Click inside the Subject field and type:
```
New Lead:
```
Then from the Dynamic content panel, click **`name`**, then type ` — `, then click **`facility`**

It should look like: `New Lead: [name] — [facility]`

**Body:**
Click inside the Body field. You can use the rich text editor or switch to HTML. Type/paste the following and insert dynamic values where shown in brackets:

```
A new staffing request was submitted through the Accucare website.

──────────────────────────
CONTACT INFORMATION
──────────────────────────

Name:       [name]
Facility:   [facility]
Email:      [email]
Phone:      [phone]

──────────────────────────
REQUEST DETAILS
──────────────────────────

Service Needed:  [service]
Message:         [message]

──────────────────────────
SUBMISSION INFO
──────────────────────────

Submitted At:  [submitted_at]
Source Page:   [source_page]
```

For each item in brackets, delete the bracket text and insert the matching dynamic content chip instead.

---

### Step D — Save the Flow

**1.** Click the **Save** button in the top-right corner

**2.** Wait for it to save (a green checkmark will appear)

**3.** Click back on the **"When a HTTP request is received"** step at the top to expand it again

**4.** You will now see a field labeled **"HTTP POST URL"** with a long URL starting with `https://prod-`

**5.** Click the **copy icon** next to that URL

---

## Part 3 — Send the URL to Your Developer

Once you have copied the HTTP POST URL, send it to your web developer in a message like this:

---

> Here is the Power Automate webhook URL for the Accucare website form:
>
> `[paste the URL here]`

---

That is all that is needed. Your developer will paste it into the website code and the form will be fully live — every submission will log to your Excel sheet and send you an email automatically.

---

## Troubleshooting

**I don't see "OneDrive for Business" as a location option**
- Make sure you are signed into Power Automate with your Microsoft 365 Business account, not a personal account.

**The Table dropdown shows nothing**
- Go back to your Excel file and confirm the data was formatted as a Table with the name `Leads`. The table must be saved before it appears in Power Automate.

**I don't see dynamic content chips when I click a field**
- Click inside the field first, then look for the "Dynamic content" panel that appears on the right. If it doesn't appear, click the lightning bolt icon or the link that says "Add dynamic content."

**The flow says "Connection required" on the Excel or Outlook step**
- Click the step, then click "Sign in" to authorize your Microsoft 365 account for that connector. Use the same account throughout.

**I saved the flow but the HTTP POST URL field is empty**
- Try refreshing the page, then re-open the flow from My Flows and click on the HTTP trigger step again. The URL generates on first save.
