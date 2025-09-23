# 👣 Footprint Forward

<div align="center">
  <img src="logo2.png" alt="Footprint Forward Logo" width="150"/>
  <p><strong>A community-driven web platform designed to transform environmental consciousness into tangible, local action.</strong></p>

  <p>
    <a href="https://footprintforward.netlify.app/"><img src="https://api.netlify.com/api/v1/badges/YOUR_NETLIFY_SITE_ID/deploy-status" alt="Netlify Status"></a>
    <img src="https://img.shields.io/badge/status-active-success.svg" alt="Project Status"/>
    <img src="https://img.shields.io/badge/License-MIT-yellow.svg" alt="License: MIT"/>
    <br/>
    <img src="https://img.shields.io/badge/HTML5-E34F26?style=for-the-badge&logo=html5&logoColor=white" alt="HTML5"/>
    <img src="https://img.shields.io/badge/CSS3-1572B6?style=for-the-badge&logo=css3&logoColor=white" alt="CSS3"/>
    <img src="https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black" alt="JavaScript"/>
    <img src="https://img.shields.io/badge/Supabase-3FCF8E?style=for-the-badge&logo=supabase&logoColor=white" alt="Supabase"/>
  </p>

  <h3>
    <a href="https://footprintforward.netlify.app/">Live Demo</a>
  </h3>
</div>


---

## 🌳 About The Project

Footprint Forward is a web application that bridges the gap between wanting to help the environment and making a measurable impact. It empowers individuals to become local environmental leaders and volunteers by providing the tools to organize, discover, and participate in real-world campaigns like cleanups, tree planting drives, and recycling events.

The platform also includes gamification elements like impact scores and regional leaderboards to encourage friendly competition and sustained engagement.

### 📸 Screenshot

![Footprint Forward Screenshot](screenshot.png)

---

## ✨ Key Features

* **Campaign Hub:** Discover, join, or create local environmental campaigns.
* **User Authentication:** Secure sign-up and login using Google OAuth via Supabase Auth.
* **User Profiles:** Personalized profiles tracking user contributions and ranks.
* **Gamification:** Earn "Impact Points" for creating and joining campaigns.
* **Leaderboards:** Compete on national, state, and district-level leaderboards.
* **Carbon Footprint Calculator:** An interactive tool to estimate and understand personal environmental impact.
* **Image Uploads:** Organizers can upload photos for their campaigns using Supabase Storage.
* **Dynamic Filtering:** Filter campaigns by category to easily find relevant events.

---

## 🛠️ Tech Stack

This project is built with a modern, serverless stack that is both powerful and free to start.

* **Frontend:**
    * HTML5
    * CSS3 (with Custom Properties for theming)
    * Vanilla JavaScript (ES6+)
* **Backend:**
    * **Supabase:** A complete open-source Firebase alternative.
        * **PostgreSQL Database:** For storing all user and campaign data.
        * **Supabase Auth:** For handling user authentication and management.
        * **Supabase Storage:** For storing user-uploaded campaign images.
        * **Edge Functions (RPC):** PostgreSQL functions for complex queries like calculating user ranks.

---

## 🚀 Getting Started

To get a local copy up and running, follow these simple steps.

### Prerequisites

* A modern web browser (e.g., Chrome, Firefox, Safari).
* A free [Supabase](https://supabase.com/) account.
* A code editor (e.g., VS Code).

### Local Installation

1.  **Clone the repository:**
    ```sh
    git clone [https://github.com/your-username/footprint-forward.git](https://github.com/your-username/footprint-forward.git)
    cd footprint-forward
    ```

2.  **Set up your Supabase Backend:**
    * Go to [Supabase](https://supabase.com/) and create a new project.
    * Navigate to **Project Settings** > **API**.
    * Find your **Project URL** and **`anon` public key**.

3.  **Update `app.js` with your Supabase credentials:**
    * Open the `app.js` file.
    * Replace the placeholder values for `SUPABASE_URL` and `SUPABASE_ANON_KEY` with your own credentials:
        ```javascript
        const SUPABASE_URL = 'YOUR_SUPABASE_PROJECT_URL';
        const SUPABASE_ANON_KEY = 'YOUR_SUPABASE_ANON_KEY';
        ```

4.  **Run the Supabase Database Setup Script:**
    * In your Supabase project, go to the **SQL Editor**.
    * Click **"+ New query"**.
    * Copy the entire SQL script from [**`setup.sql`**](#-database-setup-sql) below and paste it into the editor.
    * Click **"RUN"**. This will create all the necessary tables, functions, and security policies.

5.  **Configure Supabase Auth:**
    * Go to **Authentication** > **Providers** and enable **Google**.
    * Go to **Authentication** > **URL Configuration**.
    * In the **Redirect URLs** section, add your Netlify site URL and a localhost URL for testing:
        * `https://footprintforward.netlify.app`
        * `http://127.0.0.1:8000`

6.  **Set up Supabase Storage:**
    * Go to the **Storage** section in your Supabase dashboard.
    * Create a new **public bucket** and name it exactly `campaign-photos`.

7.  **Open the website:**
    * Open the `index.html` file in your web browser. The site should now be fully functional.

---

## 🗃️ Database Setup (`setup.sql`)

This script contains everything needed to set up your Supabase database.

<details>
<summary><strong>Click to expand the full SQL setup script</strong></summary>

```sql
-- 1. CREATE TABLES

-- Profiles table to store user data
CREATE TABLE public.profiles (
  id uuid NOT NULL PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username text UNIQUE NOT NULL,
  full_name text,
  avatar_url text,
  bio text,
  state text,
  district text,
  impact_score integer DEFAULT 0 NOT NULL,
  updated_at timestamp with time zone
);

-- Campaigns table to store event details
CREATE TABLE public.campaigns (
  id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  title text NOT NULL,
  description text,
  date date,
  time time without time zone,
  location text,
  category text,
  duration text,
  organizer_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  likes_count integer DEFAULT 0 NOT NULL,
  volunteers_count integer DEFAULT 0 NOT NULL,
  image_url text
);

-- Participants table (many-to-many relationship)
CREATE TABLE public.participants (
  campaign_id bigint NOT NULL REFERENCES public.campaigns(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  PRIMARY KEY (campaign_id, user_id)
);

-- Likes table (many-to-many relationship)
CREATE TABLE public.likes (
  campaign_id bigint NOT NULL REFERENCES public.campaigns(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  PRIMARY KEY (campaign_id, user_id)
);

-- 2. ENABLE ROW LEVEL SECURITY (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.likes ENABLE ROW LEVEL SECURITY;

-- 3. CREATE RLS POLICIES

-- Profiles policies
CREATE POLICY "Public profiles are viewable by everyone." ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can insert their own profile." ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update their own profile." ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- Campaigns policies
CREATE POLICY "Campaigns are viewable by everyone." ON public.campaigns FOR SELECT USING (true);
CREATE POLICY "Authenticated users can create campaigns." ON public.campaigns FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Organizers can update their own campaigns." ON public.campaigns FOR UPDATE USING (auth.uid() = organizer_id);
CREATE POLICY "Organizers can delete their own campaigns." ON public.campaigns FOR DELETE USING (auth.uid() = organizer_id);

-- Participants and Likes policies
CREATE POLICY "Allow full access to authenticated users." ON public.participants FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow full access to authenticated users." ON public.likes FOR ALL USING (auth.role() = 'authenticated');

-- 4. DATABASE FUNCTIONS (for RPC)

-- Function to increment user's impact score
CREATE OR REPLACE FUNCTION increment_impact_score(user_id_param uuid, points_param integer)
RETURNS void AS $$
BEGIN
  UPDATE public.profiles
  SET impact_score = impact_score + points_param
  WHERE id = user_id_param;
END;
$$ LANGUAGE plpgsql;

-- Function to get user rank
CREATE OR REPLACE FUNCTION get_user_rank(
    user_id_param uuid,
    scope_param text,
    state_param text DEFAULT NULL,
    district_param text DEFAULT NULL
)
RETURNS integer AS $$
DECLARE
    user_rank integer;
BEGIN
    WITH ranked_users AS (
        SELECT
            id,
            RANK() OVER (ORDER BY impact_score DESC) as rank
        FROM
            public.profiles
        WHERE
            (scope_param = 'national') OR
            (scope_param = 'state' AND state = state_param) OR
            (scope_param = 'district' AND state = state_param AND district = district_param)
    )
    SELECT
        rank
    INTO
        user_rank
    FROM
        ranked_users
    WHERE
        id = user_id_param;

    RETURN user_rank;
END;
$$ LANGUAGE plpgsql;

-- 5. DATABASE TRIGGERS (to update counts automatically)

-- Function to update likes_count
CREATE OR REPLACE FUNCTION update_likes_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.campaigns
  SET likes_count = (
    SELECT COUNT(*)
    FROM public.likes
    WHERE campaign_id = COALESCE(NEW.campaign_id, OLD.campaign_id)
  )
  WHERE id = COALESCE(NEW.campaign_id, OLD.campaign_id);
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Trigger for likes table
CREATE TRIGGER on_like_change
AFTER INSERT OR DELETE ON public.likes
FOR EACH ROW EXECUTE FUNCTION update_likes_count();

-- Function to update volunteers_count
CREATE OR REPLACE FUNCTION update_volunteers_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.campaigns
  SET volunteers_count = (
    SELECT COUNT(*)
    FROM public.participants
    WHERE campaign_id = COALESCE(NEW.campaign_id, OLD.campaign_id)
  )
  WHERE id = COALESCE(NEW.campaign_id, OLD.campaign_id);
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Trigger for participants table
CREATE TRIGGER on_participant_change
AFTER INSERT OR DELETE ON public.participants
FOR EACH ROW EXECUTE FUNCTION update_volunteers_count();

