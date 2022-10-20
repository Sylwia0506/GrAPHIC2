from tkinter import *
from tkinter.filedialog import askopenfilename
import os
from PIL import Image, ImageTk
import time
from tkcolorpicker import askcolor
from ppm import PPM
from tkinter.ttk import *
import tkinter.colorchooser as cch


class Menu:
    CHUNKSIZE = 10240
    root = Tk()
    w = Canvas(root,
               width=700,
               height=700,
               background='#ffffff')



    image = None

    def __init__(self):
        maincolor = 'blue'

        self.root.configure(bg=maincolor)
        self.root.title('Grafika komputerowa - Sylwia Mościcka PS2')
        self.root.minsize(width=800, height=600)
        style = Style()
        style.configure("TButton" , font=("calibri" , 10 , "bold") , borderwidth="4")
        style.map(
            "TButton" ,
            foreground=[("active" , "!disabled" , "green")] ,
            background=[("active" , "black")] ,
        )

        load_ppm = Button(self.root, width=15, command=self.load_ppm, text='Wczytaj plik PPM')
        load_ppm.grid(row=0, column=1, sticky='N')

        load_jpg = Button(self.root, width=15, command=self.load_jpg, text='Wczytaj plik JPG')
        load_jpg.grid(row=1, column=1, sticky='N')

        save_jpg = Button(self.root, width=15, command=self.save_jpg_prompt, text='Zapisz plik JPG')
        save_jpg.grid(row=2, column=1, sticky='N')

        self.w.grid(row=0, column=2, columnspan=2, rowspan=9, sticky=W+E+N+S)

        self.root.mainloop()

    def resize_image(self, image):
        wpercent = (700 / float(image.size[0]))
        hsize = int((float(image.size[1]) * float(wpercent)))
        if image.size[0] > 700 or image.size[1] > 700:
            return image.resize((700, hsize), Image.ANTIALIAS)
        return image

    def load_ppm(self):
        file = askopenfilename()
        start_time = time.time()

        filename, file_extension = os.path.splitext(file)
        if file_extension != '.ppm' and file_extension != '.pbm':
            print('Wrong file selected')
            exit()

        ppm_object = PPM()
        ppm_file = open(file, 'r', encoding='cp1250')

        try:
            ppm_object.read_ppm(ppm_file)
            ppm_file.close()

        except:
            ppm_file.close()
            file = open(file, "rb")
            ppm_object.read_ppm_binary(file, self.CHUNKSIZE)
            file.close()

        if ppm_object.drawn_pixels != ppm_object.width * ppm_object.height:
            print('Wrong amount of pixels drawn')
            exit()

        self.image = self.resize_image(ppm_object.get_image())
        print("--- %s seconds ---" % (time.time() - start_time))
        tkimage = ImageTk.PhotoImage(self.image)
        self.w.create_image(350, 350, image=tkimage)
        self.root.mainloop()

    def load_jpg(self):
        file = askopenfilename()
        filename, file_extension = os.path.splitext(file)
        if file_extension != '.jpg' and file_extension != '.jpeg':
            print('Wrong file selected')
            exit()

        self.image = self.resize_image(Image.open(file))
        tkimage = ImageTk.PhotoImage(self.image)
        self.w.create_image(350, 350, image=tkimage)
        self.root.mainloop()

    def save_jpg_prompt(self):
        if self.image is None:
            print('No images available!')
            return

        r = Tk()
        r.title('Wprowadz dane')
        r.geometry('300x150')
        Label(r, text="Kompresja").grid(column=1, row=0, sticky=W)
        Label(r, text="Nazwa pliku").grid(column=1, row=1, sticky=W)

        compression = Scale(r, from_=0, to=100, orient=HORIZONTAL)
        file_name = Entry(r)

        compression.set(90)
        file_name.insert(0, 'output.jpg')

        compression.grid(row=0, column=2)
        file_name.grid(row=1, column=2)

        save_button = Button(r, command=lambda: self.save_jpg(compression.get(), file_name.get()), text='Zapisz')
        save_button.grid(columnspan=4, row=2, column=1, padx=10, pady=10)

    def save_jpg(self, compression, file_name):
        self.image.save(file_name, quality=compression)
        r = Tk()
        r.configure(bg='#00ff00')
        r.title('Sukces')
        r.geometry('350x50')
        rlbl = Label(r, text='\nPomyslnie zapisano plik.',)
        rlbl.pack()


Menu()
