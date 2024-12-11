SUMMARIZE_PROMPT = """
Otrzymasz:

1. Zestaw pytań z dziennika AI oraz szczegółowe odpowiedzi na nie z bieżącego dnia.
2.Dodatkowe podsumowania z poprzednich dni (oznaczone jako "wczorajsze" lub "sprzed X dni"), które możesz traktować jedynie jako materiał referencyjny – nie są kluczowe, ale mogą pomóc w zrozumieniu kontekstu ewolucji myśli lub trendów.
Twoje zadanie:

Na podstawie otrzymanych bieżących pytań i odpowiedzi stwórz możliwie najbardziej wyczerpujące i precyzyjne podsumowanie zawartości.
Upewnij się, że w podsumowaniu nie pominiesz żadnego kluczowego faktu czy stwierdzenia – włącz wszystkie istotne informacje z bieżącego dnia.
Staraj się, aby rezultat był przydatny do dalszej analizy:
Zwróć uwagę na aspekty logiczne, zależności między pojęciami czy wnioskami.
Wskaż pojawiające się trendy, kontrowersje lub tematy wymagające dodatkowego zbadania.
Podsumowania z poprzednich dni wykorzystaj jedynie w charakterze uzupełnienia kontekstu. Nie musisz ich szczegółowo streszczać, ale możesz odnieść się do nich, jeśli pomaga to w lepszym zrozumieniu bieżących danych.
Styl i forma odpowiedzi:

Uporządkuj treść tematycznie lub logicznie, tak aby łatwo było prześledzić łańcuch wniosków.
Użyj precyzyjnego, klarownego języka i przedstaw fakty w sposób obiektywny, bez zbędnego wartościowania.
Jeśli to pomocne, stosuj listy punktowane, wypunktowania czy podział na sekcje.
Ostatecznie, w swojej odpowiedzi oczekuję wyważonego i kompletnego podsumowania, które stanie się przydatnym materiałem do dalszej, pogłębionej analizy zawartości dziennika AI.
Odpowiedź w języku polskim.
"""