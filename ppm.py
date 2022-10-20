class PPM:
    header_read = False
    type = None
    width = None
    height = None
    max_color = None
    pixel_spacing = None
    current_row = 0
    current_column = 0
    img = None
    pixels = None
    pixels_positions = None
    drawn_pixels = 0

    pixel_r = None
    pixel_g = None
    pixel_b = None

    def read_ppm(self, file):
        tmp_lines = file.read().splitlines()
        for index, value in enumerate(tmp_lines):
            if value.startswith('#') or value == '':
                continue
            value = value.split('#')[0]
            if not self.header_read:
                self.read_header(value)
                continue

            if self.img is None:
                self.img = Image.new('RGB', (self.width, self.height), "black")
                self.pixels = self.img.load()

            self.read_pixels(value)

    def read_ppm_binary(self, file, chunk_size):
        while not self.header_read:
            value = file.readline().decode('Cp1250').splitlines()  # stupid but works
            value = value[0]
            if value.startswith('#') or value == '':
                continue
            value = value.split('#')[0]
            self.read_header(value)

        if self.header_read:
            if self.type == 0:
                print('The P6/P3 header does not match its real type')
                exit()
            bytes_read = file.read(chunk_size)
            if self.img is None:
                self.img = Image.new('RGB', (self.width, self.height), "black")
                self.pixels = self.img.load()
            while bytes_read:
                for b in bytes_read:
                    if self.img is None:
                        self.img = Image.new('RGB', (self.width, self.height), "black")
                        self.pixels = self.img.load()
                    self.read_pixels(str(b))

                bytes_read = file.read(chunk_size)

    def read_header(self, value):
        line_elements = value.split()

        for element in line_elements:
            if self.type is None:
                if element == 'P3':
                    self.type = 0
                elif element == 'P6':
                    self.type = 1
                else:
                    print('Bad type (P3/P6)')
                    exit()
                continue
            if self.width is None:
                if not element.isdigit():
                    print('Bad width')
                    exit()
                self.width = int(element)
                continue
            if self.height is None:
                if not element.isdigit():
                    print('Bad height')
                    exit()
                self.height = int(element)
                continue
            if self.max_color is None:
                if not element.isdigit():
                    print('Bad max color')
                    exit()
                self.max_color = int(element)
                # continue
            if self.type is not None and self.width and self.height and self.max_color:
                self.header_read = True
                break
            else:
                print('Something is wrong with the header')
                exit()

    def scale_pixel(self, value):
        return round(255 / self.max_color * value)

    def read_pixels(self, value):
        line_elements = value.split()
        for element in line_elements:
            if element.startswith('#') or element == '':
                continue
            element = element.split('#')[0]

            if self.pixel_r is None:
                if self.max_color != 255:
                    self.pixel_r = self.scale_pixel(int(element))
                else:
                    self.pixel_r = int(element)
                continue
            if self.pixel_g is None:
                if self.max_color != 255:
                    self.pixel_g = self.scale_pixel(int(element))
                else:
                    self.pixel_g = int(element)
                continue
            if self.pixel_b is None:
                if self.max_color != 255:
                    self.pixel_b = self.scale_pixel(int(element))
                else:
                    self.pixel_b = int(element)
                # continue
            if self.pixel_r is not None and self.pixel_g is not None and self.pixel_b is not None:
                if self.current_row == self.height:
                    continue
                self.pixels[self.current_column, self.current_row] = (self.pixel_r, self.pixel_g, self.pixel_b)
                self.drawn_pixels += 1
                self.pixel_r = None
                self.pixel_g = None
                self.pixel_b = None
                self.current_column += 1
                if self.current_column == self.width:
                    self.current_column = 0
                    self.current_row += 1
            else:
                continue

    def show_image(self):
        self.img.show()

    def get_image(self):
        return self.img

    def save_image(self):
        self.img.save('wyjscie.bmp')