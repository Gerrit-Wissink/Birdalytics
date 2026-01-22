import requests

# List of bird image URLs to test
# image_urls = [
#     "https://cdn.harriscenter.org/wp-content/uploads/2023/06/03123626/American-Kestrel_profile_in_flight_SusanKline-880x515.jpg", # American Kestrel, clear side view in flight
#     "https://blog.nature.org/wp-content/uploads/2021/05/MeganKHines_mother-kestrel-in-box-with-eggs-1260x708.jpg", # American Kestrel, clear from the top view in a birdbox
#     "https://kanecountyconnects.com/img/medium/KCC/PublishingImages/July%202022/Kestrel%20in%20Box.jpg", # American Kestrel, low res in bird box from top view
#     "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcShb5EInptO8IESEyKf5wpfeYOaMjFbU4dC4g&s", # American Kestrel, perched on a branch, extremely low res
#     "https://avianreport.com/wp-content/uploads/2023/11/american-kestrel-nest-.jpg" # Partial American Kestrel, in bird box from side view with eggs
# ]

image_urls = [
    "https://www.hawkmountain.org/data/uploads/media/image/AmericanKestrelHawkMountainSanctuary-2.jpg?w=1024" 
]

# Get access token
token_resp = requests.post(
    "https://www.nyckel.com/connect/token",
    headers={"Content-Type": "application/x-www-form-urlencoded"},
    data={
        "grant_type": "client_credentials",
        "client_id": "66pg8s991a6vszfo6uk2gy8cf7flpgcy",
        "client_secret": "nlxhu09im4tng4khci707p08yc00dnjlx7761xu6k2fc4kwbmx968cqxlpii094z"
    }
)

access_token = token_resp.json()["access_token"]

# Invoke the bird identifier function for each image
for i, image_url in enumerate(image_urls, start=1):
    resp = requests.post(
        "https://www.nyckel.com/v1/functions/bird-identifier/invoke",
        headers={
            "Authorization": f"Bearer {access_token}",
            "Content-Type": "application/json"
        },
        json={
            "data": image_url,
            "labelCount": 5
        }
    )

    result = resp.json()

    print(f"\nImage {i}: {image_url}")
    
    print(f"Raw response: {result}")

    if "labelConfidences" in result:
        for label in result["labelConfidences"]:
            print(f"  {label['labelName']}: {label['confidence']:.2f}")
    else:
        # fallback if labelCount isn't honored
        print(f"  {result.get('labelName')}: {result.get('confidence')}")
 
"""      
Output:
Image 1: https://cdn.harriscenter.org/wp-content/uploads/2023/06/03123626/American-Kestrel_profile_in_flight_SusanKline-880x515.jpg
Raw response: {'labelName': 'Falcon', 'labelId': 'label_37yhawyvrji4fqh8', 'confidence': 0.6541828053569307}
  Falcon: 0.6541828053569307

Image 2: https://blog.nature.org/wp-content/uploads/2021/05/MeganKHines_mother-kestrel-in-box-with-eggs-1260x708.jpg
Raw response: {'labelName': 'Falcon', 'labelId': 'label_37yhawyvrji4fqh8', 'confidence': 0.3274261490973883}
  Falcon: 0.3274261490973883

Image 3: https://kanecountyconnects.com/img/medium/KCC/PublishingImages/July%202022/Kestrel%20in%20Box.jpg
Raw response: {'labelName': 'Goshawk', 'labelId': 'label_8vf28fpz15m031yv', 'confidence': 0.44204347182064124}
  Goshawk: 0.44204347182064124

Image 4: https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcShb5EInptO8IESEyKf5wpfeYOaMjFbU4dC4g&s
Raw response: {'labelName': 'Hawk (Red Shouldered)', 'labelId': 'label_ovpfzbfe9x0bvlxu', 'confidence': 0.6428823373000901}
  Hawk (Red Shouldered): 0.6428823373000901

Image 5: https://avianreport.com/wp-content/uploads/2023/11/american-kestrel-nest-.jpg
Raw response: {'labelName': 'Blue jay', 'labelId': 'label_cntvmbg2spjanmt6', 'confidence': 0.5646611170902295}
  Blue jay: 0.5646611170902295

# The model fails to identify the American Kestrel in all test images."""