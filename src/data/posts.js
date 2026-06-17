export const posts = [
  {
    id: "unturned-ii-gelistirmesi-duraklatildi",
    title: "Unturned II Geliştirmesi Geçici Olarak Duraklatıldı",
    category: "Unturned II",
    date: "2026-05-11",
    readTime: "2 dk",
    image: "https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=400&auto=format&fit=crop&q=60",
    excerpt: "Kişisel hayatımdaki bazı gelişmeler ve projenin gelecekte nasıl etkileneceğine dair detaylar.",
    content: `Son zamanlarda hayatımdaki bazı kişisel gelişmeler ve öncelik sıralamalarındaki değişiklikler nedeniyle Unturned II'nin aktif geliştirmesini bir süreliğine duraklatmaya karar verdim.

### Bu Karar Ne Anlama Geliyor?

- **Unturned 3.x Desteği Devam Edecek**: Mevcut sürüm olan Unturned 3.x için güvenlik güncellemeleri ve topluluk haritaları desteği kesintisiz devam edecek.
- **Sunucular Kapanmayacak**: Mevcut hiçbir oyun sunucusu veya servis kapanmıyor.
- **Kısa Bir Ara**: Bu kalıcı bir iptal değil, projenin temellerini yeniden gözden geçirmek için verilmiş bir ara.

> "Geliştirici olarak bazen durup büyük resme bakmak, sürekli kod yazmaktan daha faydalı olabilir."

Gelecekte daha güçlü bir şekilde döneceğiz. Bu süreçte bana destek olan tüm topluluk üyelerine teşekkür ederim!`
  },
  {
    id: "sdg-wiki-sayfasina-hos-geldiniz",
    title: "Yeni Resmi SDG Wiki Sayfası Açıldı!",
    category: "Topluluk",
    date: "2026-02-11",
    readTime: "3 dk",
    image: "https://images.unsplash.com/photo-1542751371-adc38448a05e?w=400&auto=format&fit=crop&q=60",
    excerpt: "Unturned ve Smartly Dressed Games ile ilgili her şeyi bulabileceğiniz yeni resmi viki platformumuz yayında.",
    content: `Topluluğumuzun en büyük ihtiyaçlarından biri olan güncel bilgi kaynağını tek bir çatı altında toplamak amacıyla **SDG Wiki** sayfamızı resmi olarak hizmete açtık!

### Wiki İçeriğinde Neler Var?

1. **Öğe (Item) Veritabanı**: Oyundaki tüm silahlar, kıyafetler ve yapılar.
2. **Harita Rehberleri**: Gizli yerler, NPC konumları ve ganimet (loot) haritaları.
3. **Modlama Dökümantasyonu**: Kendi modlarınızı yazmak için başlangıç kılavuzları.

Eski vikilerdeki dağınıklığı ve reklam kirliliğini önlemek adına bu yeni sistemi tamamen **reklamsız** ve topluluk moderasyonlu olarak sunuyoruz. Katkıda bulunmak için [SDG Wiki](https://wiki.smartlydressedgames.com) adresini ziyaret edebilirsiniz.`
  },
  {
    id: "bukuletken-ve-blok-karakterler",
    title: "Bükülebilir (Bendy) ve Blok Karakter Tasarım Tartışması",
    category: "Fikirler",
    date: "2025-06-11",
    readTime: "4 dk",
    image: "https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=400&auto=format&fit=crop&q=60",
    excerpt: "Unturned II için yumuşak (bendy) eklemler ile katı (rigid) blok eklemlerin artı ve eksilerini inceliyoruz.",
    content: `Unturned II'nin sanat tarzını belirlerken en çok tartıştığımız konulardan biri karakterlerin eklem animasyonlarıydı. Oyundaki karakterlerin bükülebilir (bendy) mi yoksa klasik Unturned tarzı blok eklemli mi olması gerektiğine dair teknik analizlerimiz:

### Karşılaştırma Tablosu

| Özellik | Bükülebilir (Bendy) | Katı Blok (Rigid Block) |
| :--- | :--- | :--- |
| **Görsel Akıcılık** | Çok Yüksek (Organik) | Düşük (Retro/Oyuncak gibi) |
| **Performans Yükü** | Orta (Deri Giydirme/Skinning) | Çok Düşük (Basit Transformlar) |
| **Modlama Kolaylığı**| Zor (Ağırlık Boyama gerekir) | Çok Kolay (Sadece parça yerleşimi) |

### Teknik Karar

Sonuç olarak, mod yapımcılarının işini kolaylaştırmak ve klasik Unturned ruhunu korumak adına **Katı Blok (Rigid Block)** tasarımına sadık kalmaya karar verdik. Bu sayede hem nostaljik atmosferi koruyoruz hem de saniyede 144 kare (FPS) performans hedeflerimizi yakalıyoruz.

\`\`\`csharp
// Karakter animasyon kontrolcü örneği
public class CharacterRigidController : MonoBehaviour {
    public Transform leftElbow;
    public Transform rightElbow;

    void Update() {
        // Yumuşatılmış bükülme yerine katı 90 derece rotasyon sınırları
        leftElbow.localRotation = Quaternion.Euler(0, 45f, 0);
    }
}
\`\`\`

Görüşlerinizi Discord sunucumuz üzerinden bizimle paylaşabilirsiniz!`
  },
  {
    id: "mayis-2025-gelistirme-gunlugu",
    title: "Mayıs 2025 Geliştirme Güncellemesi",
    category: "Geliştirme Günlükleri",
    date: "2025-05-31",
    readTime: "6 dk",
    image: "https://images.unsplash.com/photo-1511512578047-dfb367046420?w=400&auto=format&fit=crop&q=60",
    excerpt: "Geçtiğimiz ay gamedev sürecinde yaptığımız yenilikler, fizik motoru iyileştirmeleri ve ağ optimizasyonları.",
    content: `Mayıs ayı boyunca arka planda oyun motoru çekirdeğine odaklandık. İşte öne çıkan bazı yenilikler:

### Fizik Motoru Yenilikleri

Özellikle araç sürüş fiziğinde yaşanan takılmaları önlemek adına tekerlek sürtünme modellerini tamamen baştan yazdık. Artık yüksek hızlarda viraj alırken araçlar daha kararlı hissettiriyor.

- Araçların tepelerden uçtuğunda takla atma mekanikleri iyileştirildi.
- Çarpışma kutuları (hitbox) optimize edilerek işlemci yükü %15 düşürüldü.

### Ağ ve Ağ İletişimi (Netcode)

Sunucu gecikmesini azaltmak için yeni bir paket sıkıştırma algoritması entegre ettik.

1. **Paket Boyutu Küçültme**: Ağ üzerinden gönderilen pozisyon verisi paketleri %30 oranında küçüldü.
2. **İstemci Tahmini (Client-Side Prediction)**: Gecikmesi yüksek (High Ping) oyuncuların hareketlerindeki titremeler düzeltildi.

Gelecek ay silah eklenti sistemleri ve envanter arayüzü iyileştirmelerine odaklanacağız. Takipte kalın!`
  },
  {
    id: "unturned-ii-devlog-042",
    title: "Unturned II Devlog #042: Gölgeler ve Yumruklar",
    category: "Geliştirme Günlükleri",
    date: "2024-12-04",
    readTime: "3 dk",
    image: "https://images.unsplash.com/photo-1538481199705-c710c4e965fc?w=400&auto=format&fit=crop&q=60",
    excerpt: "4.20.14.0 güncellemesi ile gölge zombiler, yakın dövüş yumruklama mekanikleri ve dahası.",
    content: `Geliştirme sürecinde yeni bir test sürümünü (4.20.14.0) yayınladık. Bu güncellemede özellikle yakın dövüş hissini ve atmosferi güçlendiren yenilikler yer alıyor:

### Gölgelerin İçindeki Tehlike: Shade Zombies

Geceleri oyuncuları avlayan yeni bir zombi türü ekledik. Bu zombiler karanlıkta neredeyse görünmez oluyorlar ancak fener veya meşale ışığı tutulduğunda zayıflıyorlar.

- Işıktan kaçarlar.
- Arkadan saldırdıklarında çift hasar verirler.

### Yakın Dövüş: Yumruk Yumruğa

Herhangi bir silahınız olmadığında artık kendinizi savunmak için yumruklarınızı kullanabilirsiniz! Sol ve sağ tıklama ile farklı yumruk kombinasyonları yapabilirsiniz.

\`\`\`csharp
// Yakın dövüş hasar kontrolü
public void PerformPunch(bool isRightHand) {
    float damage = isRightHand ? 15.0f : 10.0f;
    RaycastHit hit;
    if (Physics.Raycast(camera.transform.position, camera.transform.forward, out hit, 1.5f)) {
        IDamageable target = hit.collider.GetComponent<IDamageable>();
        if (target != null) {
            target.TakeDamage(damage, DamageType.Punch);
            PlayPunchSound(hit.point);
        }
    }
}
\`\`\`

Keyifli testler!`
  }
];
