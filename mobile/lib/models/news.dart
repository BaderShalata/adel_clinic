class News {
  final String id;
  final String title;
  final String content;
  final String? imageURL;
  final String category;
  final DateTime publishedAt;

  News({
    required this.id,
    required this.title,
    required this.content,
    this.imageURL,
    required this.category,
    required this.publishedAt,
  });

  factory News.fromJson(Map<String, dynamic> json) {
    // Handle Firestore Timestamp format
    DateTime parsedDate;
    if (json['publishedAt'] is Map && json['publishedAt']['_seconds'] != null) {
      parsedDate = DateTime.fromMillisecondsSinceEpoch(
        (json['publishedAt']['_seconds'] as int) * 1000,
      );
    } else if (json['publishedAt'] is String) {
      parsedDate = DateTime.parse(json['publishedAt']);
    } else {
      parsedDate = DateTime.now();
    }

    return News(
      id: json['id'] as String,
      title: json['title'] as String,
      content: json['content'] as String,
      imageURL: json['imageURL'] as String?,
      category: json['category'] as String? ?? 'general',
      publishedAt: parsedDate,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'title': title,
      'content': content,
      if (imageURL != null) 'imageURL': imageURL,
      'category': category,
      'publishedAt': publishedAt.toIso8601String(),
    };
  }
}
