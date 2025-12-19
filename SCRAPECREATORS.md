Home
Youtube Channel API
Channel Shorts (we handle the pagination)
Convenience endpoint to get the latest shorts from a channel. We handle the pagination for you. This will cost you more credits because under the hood we're using the 'Channel Shorts' endpoint, just like you would. But making it easier for you. If you need more details about the short like description, publish date, etc, you'll need to use the 'Video/Short Details' endpoint.

1 credit per 48 items returned
GET
/v1/youtube/channel/shorts/simple

Try it
🤖 Why Code When AI Can Do It For You?
Stop writing code like it's 1970! Let AI do the heavy lifting - click the sparkles to copy a perfectly formatted prompt for ChatGPT, Claude, or your favorite AI assistant.

Copy for AI
Headers
x-api-key
string
required
Your Scrape Creators API key

Query Parameters
handle
string
Can pass channelId or handle

Example:
ThePatMcAfeeShow

channelId
string
Can pass channelId or handle

Example:
UC-9-kyTW8ZkZNDHQJ6FgpwQ

amount
number
required
The amount of shorts to return.

Example:
20

Channel Shorts


Home
Youtube Channel API
Channel Details
Get comprehensive channel information including stats and metadata. Can pass channelId, handle, or url.

1 creditper request
GET
/v1/youtube/channel

Try it
🤖 Why Code When AI Can Do It For You?
Stop writing code like it's 1970! Let AI do the heavy lifting - click the sparkles to copy a perfectly formatted prompt for ChatGPT, Claude, or your favorite AI assistant.

Copy for AI
Headers
x-api-key
string
required
Your Scrape Creators API key

Query Parameters
channelId
string
YouTube channel ID. Can pass a channelId, handle or url

Example:
UC-9-kyTW8ZkZNDHQJ6FgpwQ

handle
string
YouTube channel handle. Can pass a channelId, handle or url

Example:
ThePatMcAfeeShow

url
string
YouTube channel URL. Can pass a channelId, handle or url

Example:
https://www.youtube.com/@ThePatMcAfeeShow

Embed HTML
Channel Videos

cURL

Node.js

Python

PHP

Go

Java


import axios from 'axios';

const { data } = await axios.get(
  'https://api.scrapecreators.com/v1/youtube/channel',
  {
    headers: {
      'x-api-key': ''
    }
  }
);

200

400

500


{
  "channelId": "UCxcTeAKWJca6XyJ37_ZoKIQ",
  "channel": "http://www.youtube.com/@ThePatMcAfeeShow",
  "name": "The Pat McAfee Show",
  "avatar": {
    "image": {
      "sources": [
        {
          "url": "https://yt3.googleusercontent.com/ytc/AIdro_nBgMGIxgHehCAlUUepEhd9Yooi1I55k6IF2WExl-v8Q-c=s72-c-k-c0x00ffffff-no-rj",
          "width": 72,
          "height": 72
        },
        {


Scrape Creators Documentation
Scrape Creators logo
Documentation

Search or ask...
⌘K
Dashboard

API Reference
API Documentation
Introduction
TikTok
GET
Profile
GET
User's Audience Demographics
GET
Profile Videos
GET
Profile Videos (We handle pagination)
GET
Video Info
GET
Transcript
GET
TikTok Live
GET
Comments
GET
Following
GET
Followers
GET
Search Users
GET
Search by Hashtag
GET
Search by Keyword
GET
Top Search
GET
Get popular songs
GET
Get Song Details
GET
TikToks using Song
GET
Trending Feed
TikTok Shop
GET
Shop Search
GET
Shop Products
GET
Product Details
Instagram
GET
Profile
GET
Basic Profile
GET
Posts
GET
Post/Reel Info
GET
Transcript
GET
Search Reels
GET
Comments (We handle pagination)
GET
Reels
GET
Reels (We handle pagination)
GET
Story Highlights
GET
Highlights Details
GET
Reels using Song
GET
Embed HTML
YouTube
GET
Channel Details
GET
Channel Videos
GET
Channel Shorts
GET
Channel Shorts (we handle the pagination)
GET
Video/Short Details
GET
Transcript
GET
Search
GET
Search by Hashtag
GET
Comments
GET
Trending Shorts
GET
Playlist
GET
Community Post Details
LinkedIn
GET
Person's Profile
GET
Company Page
GET
Post
Facebook
GET
Profile
GET
Profile Posts
GET
Facebook Group Posts
GET
Post
GET
Transcript
GET
Comments
Facebook Ad Library
GET
Ad Details
GET
Search
GET
Company Ads
GET
Search for Companies
Google Ad Library
GET
Company Ads
GET
Ad Details
GET
Advertiser Search
LinkedIn Ad Library
GET
Search Ads
GET
Ad Details
Twitter
GET
Profile
GET
User Tweets
GET
Tweet Details
GET
Transcript
GET
Community
GET
Community Tweets
Reddit
GET
Subreddit Posts
GET
Post Comments
GET
Simple Comments
GET
Search
GET
Search Ads
GET
Get Ad
Truth Social
GET
Profile
GET
User Posts
GET
Post
Threads
GET
Profile
GET
Posts
GET
Post
GET
Search Users
Bluesky
GET
Profile
GET
Posts
GET
Post
Pinterest
GET
Search
GET
Pin
GET
User Boards
GET
Board
Google
GET
Search
Twitch
GET
Profile
GET
Clip
Kick
GET
Clip
Snapchat
GET
User Profile
Linktree
GET
Linktree page
Komi Icon
Komi
GET
Komi page
Pillar Icon
Pillar
GET
Pillar page
LinkBio Icon
Linkbio
GET
Linkbio page
Amazon Shop
GET
Amazon Shop page
Age and Gender
GET
Get Age and Gender
Scrape Creators logo
Scrape Creators
GET
Get credit balance
Home
Youtube Channel videos API
Channel Videos
Get all videos from a channel with detailed information. Can pass channelId or handle.

1 creditper request
GET
/v1/youtube/channel-videos

Try it

View Code on GitHub
🤖 Why Code When AI Can Do It For You?
Stop writing code like it's 1970! Let AI do the heavy lifting - click the sparkles to copy a perfectly formatted prompt for ChatGPT, Claude, or your favorite AI assistant.

Copy for AI
Headers
x-api-key
string
required
Your Scrape Creators API key

Query Parameters
channelId
string
YouTube channel ID

Example:
UC-9-kyTW8ZkZNDHQJ6FgpwQ

handle
string
YouTube channel handle

Example:
ThePatMcAfeeShow

sort
string
Sort by latest or popular

Example:
latest

Available options: latest, popular 
continuationToken
string
Continuation token to get more videos. Get 'continuationToken' from previous response.

Example:
4qmFsgKrCBIYVUNkRkpXVWE0M3NtUm00SXBIQnB

includeExtras
string
This will get you the like + comment count and the description. To get the full details of the video, use the /v1/youtube/video endpoint. This will slow down the response slightly.

Example:
false

Channel Details
Channel Shorts

cURL

Node.js

Python

PHP

Go

Java


import axios from 'axios';

const { data } = await axios.get(
  'https://api.scrapecreators.com/v1/youtube/channel-videos',
  {
    headers: {
      'x-api-key': ''
    }
  }
);

200

400

500


{
  "videos": [
    {
      "type": "video",
      "id": "5EWaxmWgQMI",
      "url": "https://www.youtube.com/watch?v=5EWaxmWgQMI",
      "title": "Russell Wilson Hopes To Finish Career As A Steeler, Reflects On NFL Career With Pat McAfee",
      "description": "Welcome to The Pat McAfee Show LIVE from Noon-3PM EST Mon-Fri. You can also find us live on ESPN, ESPN+, & TikTok!

Become a #McAfeeMafia member! https://www.youtube.com/channel/UCxcTeAKWJca6XyJ37_...",
      "thumbnail": "https://i.ytimg.com/vi/5EWaxmWgQMI/hqdefault.jpg?sqp=-oaymwEnCNACELwBSFryq4qpAxkIARUAAIhCGAHYAQHiAQoIGBACGAY4AUAB&rs=AOn4CLBZIBEJGcYDrduIZJpaSmYHcIHJ6g",
      "channel": {
        "title": "",
        "thumbnail": null
      },
      "viewCountText": "110,447 views",
      "viewCountInt": 110447,
      "publishedTimeText": "9 days ago",
      "publishedTime": "2025-01-23T22:48:53.914Z",
      "lengthText": "37:25",
      "lengthSeconds": 2245,
      "badges": []
    }
  ],
  "continuationToken": "4qmFsgLlFhIYV...."
}



API Documentation
Introduction
TikTok
GET
Profile
GET
User's Audience Demographics
GET
Profile Videos
GET
Profile Videos (We handle pagination)
GET
Video Info
GET
Transcript
GET
TikTok Live
GET
Comments
GET
Following
GET
Followers
GET
Search Users
GET
Search by Hashtag
GET
Search by Keyword
GET
Top Search
GET
Get popular songs
GET
Get Song Details
GET
TikToks using Song
GET
Trending Feed
TikTok Shop
GET
Shop Search
GET
Shop Products
GET
Product Details
Instagram
GET
Profile
GET
Basic Profile
GET
Posts
GET
Post/Reel Info
GET
Transcript
GET
Search Reels
GET
Comments (We handle pagination)
GET
Reels
GET
Reels (We handle pagination)
GET
Story Highlights
GET
Highlights Details
GET
Reels using Song
GET
Embed HTML
YouTube
GET
Channel Details
GET
Channel Videos
GET
Channel Shorts
GET
Channel Shorts (we handle the pagination)
GET
Video/Short Details
GET
Transcript
GET
Search
GET
Search by Hashtag
GET
Comments
GET
Trending Shorts
GET
Playlist
GET
Community Post Details
LinkedIn
GET
Person's Profile
GET
Company Page
GET
Post
Facebook
GET
Profile
GET
Profile Posts
GET
Facebook Group Posts
GET
Post
GET
Transcript
GET
Comments
Facebook Ad Library
GET
Ad Details
GET
Search
GET
Company Ads
GET
Search for Companies
Google Ad Library
GET
Company Ads
GET
Ad Details
GET
Advertiser Search
LinkedIn Ad Library
GET
Search Ads
GET
Ad Details
Twitter
GET
Profile
GET
User Tweets
GET
Tweet Details
GET
Transcript
GET
Community
GET
Community Tweets
Reddit
GET
Subreddit Posts
GET
Post Comments
GET
Simple Comments
GET
Search
GET
Search Ads
GET
Get Ad
Truth Social
GET
Profile
GET
User Posts
GET
Post
Threads
GET
Profile
GET
Posts
GET
Post
GET
Search Users
Bluesky
GET
Profile
GET
Posts
GET
Post
Pinterest
GET
Search
GET
Pin
GET
User Boards
GET
Board
Google
GET
Search
Twitch
GET
Profile
GET
Clip
Kick
GET
Clip
Snapchat
GET
User Profile
Linktree
GET
Linktree page
Komi Icon
Komi
GET
Komi page
Pillar Icon
Pillar
GET
Pillar page
LinkBio Icon
Linkbio
GET
Linkbio page
Amazon Shop
GET
Amazon Shop page
Age and Gender
GET
Get Age and Gender
Scrape Creators logo
Scrape Creators
GET
Get credit balance
Home
Youtube Video API
Transcript
Get transcript of a video or short

1 creditper request
GET
/v1/youtube/video/transcript

Try it
🤖 Why Code When AI Can Do It For You?
Stop writing code like it's 1970! Let AI do the heavy lifting - click the sparkles to copy a perfectly formatted prompt for ChatGPT, Claude, or your favorite AI assistant.

Copy for AI
Headers
x-api-key
string
required
Your Scrape Creators API key

Query Parameters
url
string
required
YouTube video or short URL

Example:
https://www.youtube.com/watch?v=bjVIDXPP7Uk

Video/Short Details
Search

cURL

Node.js

Python

PHP

Go

Java


import axios from 'axios';

const { data } = await axios.get(
  'https://api.scrapecreators.com/v1/youtube/video/transcript',
  {
    headers: {
      'x-api-key': ''
    }
  }
);

200

400

500


{
  "videoId": "bjVIDXPP7Uk",
  "type": "video",
  "url": "https://www.youtube.com/watch?v=bjVIDXPP7Uk",
  "transcript": [
    {
      "text": "welcome back to the hell farm and the",
      "startMs": "160",
      "endMs": "1920",
      "startTimeText": "0:00"
    },
    {
      "text": "backyard trails we built these jumps two",
      "startMs": "1920",
      "endMs": "3919",
      "startTimeText": "0:01"
    }
  ],
  "transcript_only_text": "welcome back to the hell farm and the backyard trails we built these jumps two years ago and last year we just kind of rebuilt them and this year......",
  "language": "English